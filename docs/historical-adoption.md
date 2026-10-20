# Adopt a historical project

Historical adapters create new external projects and pending v2 reviews. They never reuse old authorization as approval for a transformed film. Original source, media, outputs and authorization files remain unchanged.

```sh
npm run studio -- adapt fixed-sample /absolute/legacy-cashflow /absolute/new-adaptation
npm run studio -- adapt full-timeline /absolute/legacy-full-film /absolute/new-adaptation
npm run studio -- adapt external-audio /absolute/legacy-audio-project /absolute/new-adaptation
```

Only three explicit local formats are supported. The fixed cashflow format contains `src/data.json`, `src/segments.json` and `public/narration.wav`; its signed flow uses the original values and units. Full-timeline projects contain `src/facts.json`, `src/scenes.json`, `src/timeline.json`, `src/captions.json` and the selected scene audio in `public/`. External-audio projects contain `src/facts.json`, `src/scenes.json`, `src/cues.json` and `production-authorization.json` with an exact hashed local audio input.

Each result retains copied raw JSON, selected media, source/copy hashes, a new manifest, `adaptation.json` and a pending review. The report describes textual, data, timing and visual differences, mappings and unsupported features. Copied source records preserve provenance rather than claiming fresh fact verification. Unknown custom graphics remain blocked for editorial readiness; narrative excerpts do not imply the original financial visualization was reproduced. No company-specific typo correction is applied.

The external-audio adapter preserves that format's explicit round-to-nearest frame behavior and records it. This differs from new SRT import's floor-start/ceil-end policy; the adapter never silently shifts historical captions to satisfy a new rule. Invalid or overlapping historical intervals must be resolved explicitly.

Inspect mappings, units, sources, qualifiers, timing, omitted visual relationships and usage rights before approving a revised project. If unsupported features remain, map or author them first and create a new review snapshot. Only a subsequently requested, exact approved project may be regenerated. None of these commands publishes a video.
