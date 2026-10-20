import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,access} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {writeJson} from '../src/production/project-io.js';
import {productionFixture} from './production-fixture.js';
import {createProductionReview} from '../src/production/review.js';
import {snapshotProject} from '../src/production/snapshot.js';
import {saveProductionReview} from '../src/production/review-io.js';
import {renderProduction} from '../src/production/render.js';
test('pending review rejects before creating output or cache',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'studio-render-')),manifest=path.join(dir,'project.json'),review=path.join(dir,'review.json'),out=path.join(dir,'build'),cache=path.join(dir,'cache');
 await writeJson(manifest,productionFixture());await saveProductionReview(review,createProductionReview(await snapshotProject(manifest)));
 await assert.rejects(()=>renderProduction(manifest,review,out,cache),/approval_required/);
 await assert.rejects(()=>access(out));await assert.rejects(()=>access(cache));
});
