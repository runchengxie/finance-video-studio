import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash} from '../review.js';
import {type ProductionProject} from './manifest.js';
import {resolveInput} from './paths.js';
import {hashFile,readProject} from './project-io.js';

export type EditorialSnapshot={schemaVersion:2;project:Omit<ProductionProject,'reviewPath'>;assets:{id:string;path:string;sha256:string}[];templateRevision:string};
export async function productionRevision():Promise<string> {
 const dir=fileURLToPath(new URL('./',import.meta.url));
 const sources=await Promise.all((await readdir(dir)).filter(p=>p.endsWith('.ts')).sort().map(async name=>({name,sha256:await hashFile(path.join(dir,name))})));
 return hash({sources,lock:await readFile(new URL('../../package-lock.json',import.meta.url),'utf8')});
}
export async function snapshotProject(manifestFile:string):Promise<EditorialSnapshot> {
 const project=await readProject(manifestFile),assets=[];
 for(const asset of project.inputs){const file=await resolveInput(manifestFile,asset.path),actual=await hashFile(file);if(actual!==asset.sha256)throw new Error(`input_hash_mismatch:${asset.id}`);assets.push({id:asset.id,path:asset.path,sha256:actual});}
 const {reviewPath:_,...editorial}=project;void _;
 return {schemaVersion:2,project:editorial,assets:assets.sort((a,b)=>a.id.localeCompare(b.id,'en')),templateRevision:await productionRevision()};
}
