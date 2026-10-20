import {test} from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {isExternalPath} from '../src/path-policy.js';

test('Windows external paths accept other drives and reject repository descendants',()=>{
 const repo='C:\\code\\studio';
 for(const out of ['D:\\data\\studio','C:\\data\\studio','C:\\code\\studio-copy','C:\\code']) {
  assert.equal(isExternalPath(repo,out,path.win32),true,out);
 }
 for(const out of [repo,'c:\\CODE\\STUDIO','C:\\code\\studio\\output','C:\\code\\studio\\..scratch','C:\\code\\studio\\out\\..\\input','relative','D:relative']) {
  assert.equal(isExternalPath(repo,out,path.win32),false,out);
 }
});

test('POSIX external paths require a complete parent component',()=>{
 const repo='/code/studio';
 for(const out of ['/data/studio','/code/studio-copy','/code','/']) {
  assert.equal(isExternalPath(repo,out,path.posix),true,out);
 }
 for(const out of [repo,'/code/studio/output','/code/studio/..scratch','/code/studio/out/../input','../relative']) {
  assert.equal(isExternalPath(repo,out,path.posix),false,out);
 }
});
