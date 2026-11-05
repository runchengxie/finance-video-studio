import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,link,symlink,readFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {inventoryStorage} from '../src/production/retention.js';
test('storage inventory counts distinct inodes, ignores symlinks and never modifies originals',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'retention-'));t.after(()=>rm(root,{recursive:true,force:true}));
 await writeFile(path.join(root,'one.pdf'),'same bytes');await writeFile(path.join(root,'two.pdf'),'same bytes');await link(path.join(root,'one.pdf'),path.join(root,'alias.pdf'));await symlink(path.join(root,'two.pdf'),path.join(root,'outside.pdf'));await mkdir(path.join(root,'node_modules'));await writeFile(path.join(root,'node_modules','skip'),'same bytes');
 const r=await inventoryStorage(root);assert.equal(r.fileCount,3);assert.equal(r.logicalBytes,30);assert.equal(r.uniqueInodeBytes,20);assert.equal(r.alreadySharedBytes,10);assert.equal(r.potentialDuplicateBytes,10);assert.equal(r.groups.length,1);assert.equal(r.symlinks.length,1);assert.equal(await readFile(path.join(root,'two.pdf'),'utf8'),'same bytes');
});
