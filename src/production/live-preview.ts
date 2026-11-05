import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {fontCss} from '../render.js';
import {hash} from '../review.js';
import {snapshotProject} from './snapshot.js';
import {assertExternal,assertOutput,actualPath,within,resolveInput} from './paths.js';
import {hashFile,writeJson} from './project-io.js';
import {productionProfileIssues} from './profile.js';
import {loadVisualAssets} from './visual-assets.js';
import {escapeHtml} from './templates.js';

const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const relativeUrl=(root:string,file:string)=>path.relative(root,file).split(path.sep).map(encodeURIComponent).join('/');
async function sharedAsset(directory:string,prefix:string,extension:string,bytes:Uint8Array){
 const digest=sha(bytes),file=path.join(directory,`${prefix}-${digest}.${extension}`);
 try{await writeFile(file,bytes,{flag:'wx'});}catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;}
 if(await hashFile(file)!==digest)throw new Error('preview_asset_hash_mismatch');return file;
}
export async function createLivePreview(manifest:string,output:string,assetCache=path.join(path.dirname(manifest),'review-assets')){
 await assertOutput(manifest,output);await assertOutput(manifest,assetCache);await assertExternal(assetCache);
 const a=await actualPath(assetCache),o=await actualPath(output);if(within(a,o)||within(o,a))throw new Error('preview_cache_overlap');
 const snapshot=await snapshotProject(manifest),p=snapshot.project;
 if(p.width!==1080||p.height!==1440||p.render.broadcast?.backgroundVideoId||p.scenes.some(s=>s.presentation?.evidencePanels?.length))throw new Error('live_preview_requires_native_portrait');
 if(p.render.backgroundAudioId||p.render.normalization)throw new Error('live_preview_mixed_audio_unsupported');
 await mkdir(path.dirname(output),{recursive:true});await mkdir(output);await mkdir(assetCache,{recursive:true});
 const bundled=await build({entryPoints:[fileURLToPath(new URL('./preview-client.ts',import.meta.url))],bundle:true,write:false,minify:true,format:'iife',platform:'browser',target:'es2022',plugins:[{name:'input-path-check',setup(context){
  context.onResolve({filter:/^node:path$/},()=>({path:'input-path-check',namespace:'preview'}));
  context.onLoad({filter:/.*/,namespace:'preview'},()=>({contents:'export default {posix:{isAbsolute:p=>p.startsWith("/")},win32:{isAbsolute:p=>/^[a-z]:/i.test(p)||p.startsWith("/")||p.startsWith(String.fromCharCode(92))}}',loader:'js'}));
 }}]});
 const js=bundled.outputFiles[0]!.contents,font=Buffer.from(await fontCss());
 const script=await sharedAsset(assetCache,'renderer','js',js),stylesheet=await sharedAsset(assetCache,'font','css',font);
 const imageResources=[];const visualAssets=await loadVisualAssets(manifest,p);
 for(const [id,uri] of visualAssets){const bytes=Buffer.from('window.STUDIO_VISUALS=window.STUDIO_VISUALS||{};window.STUDIO_VISUALS['+JSON.stringify(p.inputs.find(x=>x.id===id)!.sha256)+']='+JSON.stringify(uri)+';\n');const file=await sharedAsset(assetCache,'image','js',bytes);imageResources.push({path:file,sha256:sha(bytes)});}
 const audio=p.render.audioId?p.inputs.find(x=>x.id===p.render.audioId):undefined,edit=p.productionProfile?.audioEdit,original=edit?.decision==='trim'?p.inputs.find(x=>x.id===edit.sourceAudioId):undefined;
 const data={project:p,audioUrl:audio?relativeUrl(output,await resolveInput(manifest,audio.path)):null,sourceAudioUrl:original?relativeUrl(output,await resolveInput(manifest,original.path)):null,fontUrl:relativeUrl(output,stylesheet),snapshotHash:hash(snapshot)};
 await writeFile(path.join(output,'data.js'),'window.STUDIO_PREVIEW='+JSON.stringify(data).replace(/</g,'\\u003c')+';\n',{flag:'wx'});
 const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' file:; style-src 'self' file: 'unsafe-inline'; font-src data:; img-src data:; media-src 'self' file:; frame-src 'self' about:"><title>Live production preview</title><style>body{max-width:1200px;margin:24px auto;padding:0 20px;background:#f8f5ef;color:#25282b;font:16px/1.65 system-ui}#stage{position:relative;overflow:hidden;width:min(100%,720px,48.75vh);margin:auto}iframe{border:0;transform-origin:0 0}audio,input[type=range]{width:100%;margin:12px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}button{cursor:pointer;padding:8px;margin:3px;border:1px solid #ddd;background:#fffaf3;text-align:left}#cues{max-height:480px;overflow:auto}#cues button{display:block;width:97%}.active{background:#f6dfcc!important}small{color:#796d63}#snapshot{overflow-wrap:anywhere}input[type=search]{padding:9px;width:90%}section{margin:20px 0}a{color:#b92a28}@media(max-width:700px){.grid{display:block}}</style><label data-i18n="language">Language</label> <select id="language"><option value="en">English</option><option value="zh">简体中文</option></select><h1 id="title"></h1><p id="notice" data-i18n="notice"></p><div id="stage"><iframe id="screen" title="Native frame"></iframe></div><audio id="voice" controls preload="metadata"></audio><input id="frame" type="range" value="0" min="0" aria-label="Frame"><div id="position"></div><div class="grid"><section><h2 data-i18n="chapters"></h2><div id="chapters"></div></section><section><h2 data-i18n="cues"></h2><input id="search" type="search"><div id="cues"></div></section></div><section id="trim"><h2 data-i18n="cuts"></h2><p id="cut-interval"></p><p data-i18n="trimNotice"></p><h3 data-i18n="source"></h3><audio id="source" controls preload="metadata"></audio><button id="intro" data-i18n="intro"></button><button id="outro" data-i18n="outro"></button></section><details><summary data-i18n="sources"></summary><div id="sources"></div></details><p><small data-i18n="snapshot"></small> <small id="snapshot"></small></p><script src="data.js"></script>${imageResources.map(r=>`<script src="${escapeHtml(relativeUrl(output,r.path))}"></script>`).join('')}<script src="${escapeHtml(relativeUrl(output,script))}"></script></html>`;
 await writeFile(path.join(output,'index.html'),html,{flag:'wx'});
 if(hash(await snapshotProject(manifest))!==hash(snapshot))throw new Error('inputs_changed_during_preview');
 const report={schemaVersion:1,snapshotHash:hash(snapshot),templateRevision:snapshot.templateRevision,projectId:p.id,encodedMp4:false,approvalGranted:false,manualListening:false,copiedAudio:false,copiedImages:false,resources:[...imageResources,{path:script,sha256:sha(js)},{path:stylesheet,sha256:sha(font)}],profileIssues:productionProfileIssues(p),notice:'Native time-driven local inspection only. Resource/source hashes checked at creation, not continuously after opening.'};
 await writeJson(path.join(output,'preview.json'),report);return report;
}
