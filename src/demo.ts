import {readFile} from 'node:fs/promises';
import {schema,type Project} from './core.js';
import {hash} from './review.js';
export function assertSyntheticFixture(p:Project):void{
 if(hash(p)!=='84b45c1fdac4bdd1b58c8813d3ab1f52387e6f73535f0232cfdd4cf4891af47f')throw new Error('Synthetic demo fixture changed; arbitrary manuscripts require review');
}
export type DemoFixture='demo'|'bar-smoke'|'line-smoke';
export async function demoFixture(name:DemoFixture):Promise<Project>{
 if(!['demo','bar-smoke','line-smoke'].includes(name))throw new Error('Unknown fixed synthetic fixture');
 const p=schema.parse(JSON.parse(await readFile(new URL('../examples/demo.json',import.meta.url),'utf8')));
 assertSyntheticFixture(p);
 if(name==='bar-smoke'){p.frames=90;p.captions=p.captions.map((c,i)=>({...c,start:i*30,end:(i+1)*30}));}
 if(name==='line-smoke'){p.chart='line';p.frames=60;p.captions=[{start:0,end:60,text:'合成音调测试，不是配音成品'}];}
 return p;
}
