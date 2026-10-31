import type {ProductionProject} from './manifest.js';
export const palettes={
 'warm-paper':{background:'#f8f5ef',surface:'#fffaf3',ink:'#25282b',muted:'#796d63',accent:'#b92a28',secondary:'#996424',negative:'#a52f55'},
 navy:{background:'#0c1520',surface:'#152536',ink:'#f0f5f7',muted:'#a7bacb',accent:'#61dac3',secondary:'#e6ac68',negative:'#e98c94'}
} as const;
export function visualPalette(p:ProductionProject){return palettes[p.render.visual?.preset??(p.width===1080?'warm-paper':'navy')];}
export function applyVisualProfile(html:string,p:ProductionProject,frame:number):string {
 if(!p.render.visual)return html;
 const colors=visualPalette(p);let result=html;
 for(const key of Object.keys(palettes.navy) as (keyof typeof colors)[])result=result.replaceAll(palettes.navy[key],colors[key]);
 if(p.render.theme==='broadcast-v1')result=result.replaceAll('#b72c62',colors.accent).replaceAll('#e45388',colors.accent);
 const x=p.render.visual.motion==='subtle'?Math.sin(frame/p.fps/12)*18:0;
 return result.replace('</style>',`body:before{content:'';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(120deg,transparent 0 140px,${colors.muted}0b 142px 144px,transparent 146px 235px);transform:translateX(${x}px)}header,h1,svg,.source,.caption{z-index:1}.broadcast{background:${colors.background}dd;color:${colors.ink}}.broadcast .side,.broadcast .documents,.broadcast .steps article{background:${colors.surface}}.broadcast .source,.broadcast .unit,.broadcast .side-item{color:${colors.muted}}.broadcast .side-item.active{color:${colors.ink}}.broadcast .lower{background:${colors.surface};color:${colors.ink}}.broadcast .brand,.broadcast .chapter,.broadcast .documents-heading{color:${colors.background}}</style>`);
}
