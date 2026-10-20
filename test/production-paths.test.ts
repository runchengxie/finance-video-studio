import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {resolveInput,assertOutput} from '../src/production/paths.js';

test('project input and output boundaries include real link targets and missing ancestors',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'production-paths-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const project=path.join(root,'project');await mkdir(path.join(project,'inputs'),{recursive:true});await writeFile(path.join(project,'project.json'),'{}');await writeFile(path.join(project,'inputs','data.txt'),'original');
 const manifest=path.join(project,'project.json');
 assert.equal(await resolveInput(manifest,'inputs/data.txt'),path.join(project,'inputs','data.txt'));
 for(const p of ['../escape','D:foo','https://example.com/data','/absolute','inputs/../outside'])await assert.rejects(()=>resolveInput(manifest,p));
 await assertOutput(manifest,path.join(root,'new','build'));
 await assert.rejects(()=>assertOutput(manifest,path.join(project,'inputs','new-build')));
 await assert.rejects(()=>assertOutput(manifest,path.join(process.cwd(),'..scratch')));
 const common=execFileSync('git',['rev-parse','--git-common-dir'],{encoding:'utf8'}).trim();
 const primary=path.dirname(path.resolve(common));await assert.rejects(()=>assertOutput(manifest,path.join(primary,'forbidden-test-output')));
 const outside=path.join(root,'outside');await mkdir(outside);await writeFile(path.join(outside,'secret.txt'),'test');
 try{await symlink(outside,path.join(project,'inputs','linked'),'junction');await symlink(process.cwd(),path.join(root,'linked-output'),'junction');}
 catch(e){if(['EPERM','EACCES'].includes((e as NodeJS.ErrnoException).code??'')){t.diagnostic('OS link permission unavailable');return;}throw e;}
 await assert.rejects(()=>resolveInput(manifest,'inputs/linked/secret.txt'));
 await assert.rejects(()=>assertOutput(manifest,path.join(root,'linked-output','not-created','build')));
 const linkedProject=path.join(root,'linked-project');await mkdir(linkedProject);await symlink(outside,path.join(linkedProject,'inputs'),'junction');
 await assert.rejects(()=>resolveInput(path.join(linkedProject,'project.json'),'inputs/secret.txt'));
});
