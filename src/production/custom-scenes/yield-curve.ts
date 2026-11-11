import {z} from 'zod';
import {visualPalette} from '../visual-profile.js';
import type {CustomSceneContext,CustomSceneDefinition,CustomSceneFact} from './index.js';

const point=z.object({id:z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/),label:z.string().trim().min(1).max(40),termYears:z.number().finite().min(0).max(50),yieldPercent:z.number().finite().min(-10).max(50)}).strict();
const inputSchema=z.object({unit:z.literal('%'),points:z.array(point).min(2).max(8)}).strict();
const escape=(value:unknown)=>String(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]!));
const opacity=(state:CustomSceneContext['state'],id:string)=>{const target=state.targets[id];return !target||!target.visible?0:target.action==='reveal'?1-(1-target.progress)**3:1;};
export const yieldCurve:CustomSceneDefinition={id:'yield-curve-v1',validate(input:unknown){
 const data=inputSchema.parse(input),targets=['curve',...data.points.map(value=>value.id)],facts:CustomSceneFact[]=data.points.map(value=>({target:value.id,values:[value.yieldPercent],unit:data.unit,periods:[value.label]}));
 return {targets,facts,draw:({project,state})=>{
  const palette=visualPalette(project),terms=data.points.map(value=>value.termYears),yields=data.points.map(value=>value.yieldPercent),minTerm=Math.min(...terms),maxTerm=Math.max(...terms),minYield=Math.min(0,...yields),maxYield=Math.max(1,...yields);
  const x=(term:number)=>80+(maxTerm===minTerm?0:(term-minTerm)/(maxTerm-minTerm)*680),y=(value:number)=>430-(value-minYield)/(maxYield-minYield)*320;
  const line=data.points.map(value=>`${x(value.termYears)},${y(value.yieldPercent)}`).join(' '),curve=opacity(state,'curve');
  return `<div class="unit" data-fit>${escape(data.unit)}</div><svg width="840" height="520" viewBox="0 0 840 520"><path d="M70 60V430H800" fill="none" stroke="${palette.muted}"/><text data-fit x="0" y="80">${escape(maxYield)}</text><text data-fit x="0" y="430">${escape(minYield)}</text><g data-target="curve" opacity="${curve}"><polyline points="${line}" fill="none" stroke="${palette.accent}" stroke-width="6" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1-curve}"/></g>${data.points.map(value=>`<g data-target="${escape(value.id)}" opacity="${opacity(state,value.id)}"><circle cx="${x(value.termYears)}" cy="${y(value.yieldPercent)}" r="8" fill="${palette.secondary}"/><text data-fit x="${x(value.termYears)}" y="${y(value.yieldPercent)-18}" text-anchor="middle">${escape(value.label)} ${escape(value.yieldPercent)}%</text><text data-fit x="${x(value.termYears)}" y="470" text-anchor="middle">${escape(value.termYears)}Y</text></g>`).join('')}</svg>`;
 }};
}};
