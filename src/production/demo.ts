import {readFile} from 'node:fs/promises';
import {hash} from '../review.js';
import {parseProject,type ProductionProject} from './manifest.js';
export type DemoVariant='improved'|'legacy-comparison';
export function assertProductionFixture(value:unknown):ProductionProject {
 const p=parseProject(value);if(hash(p)!=='d31dca839d44dc87b310d41f2490ab0d00c364e3e6c331605240e6854b74d60c')throw new Error('fixed_synthetic_content_changed');return p;
}
export async function productionDemoFixture(variant:DemoVariant):Promise<ProductionProject>{
 if(!['improved','legacy-comparison'].includes(variant))throw new Error('unknown_fixed_variant');
 return assertProductionFixture(JSON.parse(await readFile(new URL('../../examples/production/film.json',import.meta.url),'utf8')));
}
export {renderProductionDemo} from './render.js';
