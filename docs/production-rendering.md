# Reviewed production rendering

The v2 renderer supports six original templates at 1920×1080 and 30 fps. Manuscript, cues, chart data, sources, input hashes and renderer revisions form one editorial snapshot. V1 commands and reviews remain separate.

## Review the exact revision

```sh
npm run studio -- review init /absolute/project.json /absolute/new-review.json
npm run studio -- review import /absolute/new-review.json /absolute/manual-result.json /absolute/imported-review.json
npm run studio -- review status /absolute/imported-review.json
npm run studio -- review approve /absolute/imported-review.json /absolute/approval-options.json /absolute/approved-review.json --confirm-review
npm run studio -- render /absolute/project.json /absolute/approved-review.json /absolute/new-build /absolute/cache
```

The manual result contains `inputHash`, `decision` (`accepted` or `rejected`), the complete `polished` snapshot, `changeNotes` and `skillUse` (`not_used` or `operator_reported`). Copy the review's draft snapshot when retaining the original wording. Accepted import never grants approval. Text polish cannot change source references, visual data, timing, asset bytes or render settings; these require a new snapshot. Apply accepted text to a new project revision before rendering it.

Approval options contain `reviewer`, `factReviewNotes`, `differenceReviewNotes` when factual tokens changed, and an ISO UTC `expiresAt`. The explicit confirmation records an operator decision; this command never invokes a writing skill. Human-writing adapters documented for v1 do not implement this v2 protocol. A cached status field cannot grant approval.

Inputs and review are reloaded before assembly and final publication. Changed bytes, expired approval, edited review content or changed renderer sources reject the build. Pending review is rejected before output/cache creation. Use a new build directory each time. Keep cache and output separate from project inputs and source checkouts.

## Deterministic visuals and cache

Metric, comparison, waterfall, trend, process and evidence templates share caption/source safe areas, local pinned fonts and English/Chinese labels selected by `contentLanguage`. Chart units and period labels are authored explicitly. Reveals and highlights resolve from integer frames and cue IDs; unresolved events block rendering. The renderer checks loaded fonts, text bounds and caption collisions offline. Long claims may require shorter on-screen text or another scene; overflow is an error.

Scenes compile into short animation spans and static holds, split at cue boundaries. Content, actual asset hashes, renderer/lock revisions, font/browser/FFmpeg versions and encoding settings enter cache keys. Cached segments require a matching receipt, SHA-256 and actual media decode. Cache reuse never grants editorial approval. Failed builds retain diagnostics and cannot publish `final.mp4`.

`final.mp4`, `build.json` and `timeline/` contain the verified video, stage hit/miss reasons and timing, subtitles, chapters and storyboard. Captions are rendered from the same cue timeline. Audio is optional, selected only by manifest asset IDs; optional background mixing and loudness normalization must be explicit. Full decoding verifies technical integrity; `manualListening: false` remains until a human listens.

## Fixed comparison example

```sh
npm run production:example -- /absolute/new-example improved
npm run production:example -- /absolute/new-comparison legacy-comparison
```

Both closed variants use the same pinned 36-second fictional content, values, cues, tone and dimensions. The comparison variant uses separate number cards; the improved version uses a shared zero baseline, cue-linked focus and a connected difference. Other scenes demonstrate a waterfall, process and trend. This fixture entry accepts neither arbitrary projects nor external audio, and `fictional: true` alone grants no permission to render. Each run includes cold and warm builds with measured timings. The generated tone is a test signal, not narration.

```sh
node --import tsx test/production-visuals.ts /absolute/new-template-inspection
```

This retains all six templates, intermediate frames and 360/390px previews. Small previews help identify density problems; automated layout checks do not establish mobile legibility, factual correctness or voice quality.
