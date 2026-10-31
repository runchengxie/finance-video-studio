import {mkdir,readFile,writeFile,copyFile,constants} from 'node:fs/promises';
import path from 'node:path';
import type {ProductionProject} from './manifest.js';
import {snapshotProject} from './snapshot.js';
import {hash} from '../review.js';
import {hashFile,writeJson} from './project-io.js';
import {assertExternal,assertOutput,actualPath,within,resolveInput} from './paths.js';
import {nativeBuildReportSchema} from './build-report.js';
import {compileStages} from './stages.js';
import {verifyMedia} from './verify.js';
import {productionColors} from './encoding.js';
import {auditNumericClaims} from './evidence-ledger.js';
const catalogs={en:{issueMessages:{numeric_cue_missing_claim:'Numeric narration has no evidence claim.',claim_cue_alignment:'Claim cue does not overlap its scene.',claim_target_reference:'Claim target is missing.',visual_period_unresolved:'Claim period does not identify a trend point.',visual_value_mismatch:'Claim value differs from visual target.',visual_unit_mismatch:'Claim unit differs from visual target.',claim_source_reference:'Claim evidence is missing or not linked to its scene.'},audio:'Original audio',title:'Internal production review',cues:'Narration cues',issues:'Numeric evidence issues',sources:'Original sources',notes:'Internal notes',claims:'Numeric claims',notice:'Internal review only. This page does not verify facts or grant rendering approval.',none:'None',language:'Language'},zh:{issueMessages:{numeric_cue_missing_claim:'数字旁白尚未关联证据声明。',claim_cue_alignment:'声明对应的旁白与场景时间不重叠。',claim_target_reference:'找不到声明对应的画面对象。',visual_period_unresolved:'声明的期间无法对应到趋势图中的数据点。',visual_value_mismatch:'声明数值与画面数值不一致。',visual_unit_mismatch:'声明单位与画面单位不一致。',claim_source_reference:'声明缺少证据，或证据未关联到对应场景。'},audio:'原始音频',title:'内部制作审阅',cues:'旁白时间轴',issues:'数字证据问题',sources:'原始来源',notes:'内部备注',claims:'数字声明',notice:'仅供内部审阅。本页不核验事实，也不授予渲染许可。',none:'无',language:'语言'}};
export function reviewPageHtml(p:ProductionProject):string {
 const data=JSON.stringify({project:p,audit:auditNumericClaims(p),catalogs}).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; media-src 'self' file:; script-src 'unsafe-inline'; style-src 'unsafe-inline'"><title>Internal review</title><style>body{font:16px system-ui;max-width:1100px;margin:2rem auto;padding:1rem}video{width:100%;max-height:65vh}a,button{cursor:pointer}li{margin:.7rem 0}section{border-top:1px solid #aaa;margin-top:2rem}</style></head><body><select id="language"><option value="en">English</option><option value="zh">中文</option></select><h1 id="title"></h1><p id="notice"></p><video id="video" controls preload="metadata" src="final.mp4"></video><main id="content"></main><script>
const data=${data};const p=data.project,video=document.getElementById('video');let locale=p.contentLanguage;const select=document.getElementById('language');select.value=locale;
function node(tag,text,parent){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(parent)parent.append(el);return el;}
function seek(id){const cue=p.cues.find(c=>c.id===id);if(cue){video.currentTime=cue.startFrame/p.fps;}}
function link(parent,text,id){const a=node('a',text,parent);a.href='#cue='+encodeURIComponent(id);a.addEventListener('click',()=>seek(id));return a;}
function draw(){const t=data.catalogs[locale];document.documentElement.lang=locale;document.getElementById('title').textContent=t.title+' — '+p.title;document.getElementById('notice').textContent=t.notice;const main=document.getElementById('content');main.replaceChildren();
function section(key){const s=node('section',undefined,main);node('h2',t[key],s);return node('ul',undefined,s);}
let list=section('audio');for(const id of [p.render.audioId,p.render.backgroundAudioId]){const input=p.inputs.find(x=>x.id===id);if(input){const li=node('li',input.id,list);const audio=node('audio',undefined,li);audio.controls=true;audio.preload='metadata';audio.src=input.path;}}
list=section('cues');for(const c of p.cues){const li=node('li',undefined,list);link(li,(c.startFrame/p.fps).toFixed(2)+'s '+c.text,c.id);}
list=section('issues');for(const i of data.audit.issues){const li=node('li',undefined,list);const message=t.issueMessages[i.code]||data.catalogs.en.issueMessages[i.code]||i.message;if(i.cueId)link(li,i.code+' '+message,i.cueId);else node('span',message,li);for(const id of i.sourceIds||[]){const a=node('a',' ['+id+']',li);a.href='#source-'+id;}}if(!data.audit.issues.length)node('li',t.none,list);
list=section('claims');for(const c of p.numericClaims||[]){const li=node('li',undefined,list);link(li,c.value+' '+c.unit+' · '+c.period+' · '+c.scope+' · '+c.status,c.cueId);if(c.calculation)node('p',c.calculation,li);for(const id of c.sourceIds){const a=node('a',' ['+id+']',li);a.href='#source-'+id;}}
list=section('sources');for(const s of p.sources){const li=node('li',s.citation,list);li.id='source-'+s.id;if(s.url){try{const url=new URL(s.url);if(['https:','http:'].includes(url.protocol)){const a=node('a',' '+s.url,li);a.href=url.href;a.rel='noreferrer noopener';a.target='_blank';}}catch{}}if(s.inputId){const input=p.inputs.find(x=>x.id===s.inputId);if(input){const a=node('a',input.path,li);a.href=input.path;a.target='_blank';a.rel='noopener';node('p',input.provenance+' · '+input.rights,li);}}}
list=section('notes');for(const n of p.internalNotes||[])node('li',n.text,list);
}
select.addEventListener('change',()=>{locale=select.value;draw();});function hashSeek(){if(location.hash.startsWith('#cue=')){try{seek(decodeURIComponent(location.hash.slice(5)));}catch{}}}window.addEventListener('hashchange',hashSeek);video.addEventListener('loadedmetadata',hashSeek);draw();
</script></body></html>`;
}
export async function createReviewPage(manifestFile:string,buildDirectory:string,output:string){
 const snapshot=await snapshotProject(manifestFile);await assertOutput(manifestFile,output);await assertExternal(buildDirectory);
 const source=await actualPath(buildDirectory),destination=await actualPath(output);if(within(source,destination)||within(destination,source))throw new Error('review_build_overlap');
 const parsed=nativeBuildReportSchema.safeParse(JSON.parse(await readFile(path.join(buildDirectory,'build.json'),'utf8')));if(!parsed.success)throw new Error('native_build_report_required');const build=parsed.data;
 if(build.inputHash!==hash(snapshot))throw new Error('build_snapshot_mismatch');
 if(hash(build.stages.map(s=>s.id))!==hash(compileStages(snapshot.project).map(s=>s.id))||!build.verification.checks.some(c=>c.name==='full_decode'))throw new Error('native_build_report_incomplete');
 const video=path.join(buildDirectory,'final.mp4');if(await hashFile(video)!==build.verification.sha256)throw new Error('build_media_hash_mismatch');const p=snapshot.project;
 const verification=await verifyMedia(video,{width:p.width,height:p.height,fps:p.fps,frames:p.durationFrames,durationSeconds:p.durationFrames/p.fps,videoCodec:'h264',pixelFormat:'yuv420p',...productionColors,audio:{required:!!p.render.audioId||!!p.render.backgroundAudioId,...(p.render.audioId||p.render.backgroundAudioId?{codec:'aac'}:{})}});if(!verification.ok)throw new Error('review_media_verification_failed');
 if(hash(await snapshotProject(manifestFile))!==hash(snapshot))throw new Error('review_snapshot_changed');
 await mkdir(output);await copyFile(video,path.join(output,'final.mp4'),constants.COPYFILE_EXCL);if(await hashFile(path.join(output,'final.mp4'))!==verification.sha256)throw new Error('copied_media_changed');
 for(const inputId of new Set([...p.sources.map(s=>s.inputId),p.render.audioId,p.render.backgroundAudioId].filter((id):id is string=>!!id))){const asset=p.inputs.find(i=>i.id===inputId)!;const destination=path.join(output,asset.path);await mkdir(path.dirname(destination),{recursive:true});await copyFile(await resolveInput(manifestFile,asset.path),destination,constants.COPYFILE_EXCL);if(await hashFile(destination)!==asset.sha256)throw new Error('copied_source_changed');}
 await writeFile(path.join(output,'index.html'),reviewPageHtml(p),{flag:'wx'});await writeJson(path.join(output,'snapshot.json'),snapshot);const receipt={complete:true,internal:true,published:false,renderApproval:false,factualVerification:false,snapshotHash:hash(snapshot),mediaHash:verification.sha256,page:path.join(output,'index.html')};await writeJson(path.join(output,'review-page.json'),receipt);return receipt;
}
