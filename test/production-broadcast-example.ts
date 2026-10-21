import {renderBroadcastDemo} from '../src/production/render.js';
import {readFile} from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
const [output,...extra]=process.argv.slice(2);if(!output||extra.length)throw new Error('fixed_demo_output_only');
await renderBroadcastDemo(output);
const cold=JSON.parse(await readFile(path.join(output,'build/build.json'),'utf8')),warm=JSON.parse(await readFile(path.join(output,'warm-build/build.json'),'utf8'));
assert.ok(cold.ok&&warm.ok);assert.ok(warm.stages.every((s:{hit:boolean})=>s.hit));assert.equal(cold.verification.sha256,warm.verification.sha256);
console.log(JSON.stringify({ok:true,frames:360,warmCache:true,identicalVideo:true}));
