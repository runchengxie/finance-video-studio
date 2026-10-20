import {readJson,writeJson} from './project-io.js';
import {assertExternal} from './paths.js';
import {parseProductionReview,productionReviewStatus,type ProductionReview} from './review.js';

export async function loadProductionReview(file:string):Promise<ProductionReview> {
 await assertExternal(file);const envelope=await readJson(file) as {review?:unknown};return parseProductionReview(envelope.review);
}
export async function saveProductionReview(file:string,review:ProductionReview):Promise<void> {
 await writeJson(file,{status:productionReviewStatus(review),review:parseProductionReview(review)});
}
