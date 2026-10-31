---
name: finance-video-production
description: Prepare or revise finance explainer videos from narration, manuscripts and research using the finance-video-studio project, including numeric visuals, subtitles, covers and formal delivery.
---

# Finance video production

Use the existing repository pipeline instead of recreating per-episode export scripts. Locate `finance-video-studio` from the working context or explicitly configured code root; ask for its location only if neither is available. Read its `AGENTS.md`, `docs/production-workflow.md` and the applicable language version of `docs/editorial-review.md`. For command contracts, read `docs/production-tools.md`, `docs/production-rendering.md` and `docs/production-delivery.md` in that repository. Repository code and docs are authoritative for supported formats.

For native portrait, caches, numeric evidence and review pages, read `docs/production-advanced.md`. Choose explicitly between 1920×1080/30 and 1080×1440/60; do not crop a landscape scene or silently map legacy HTML. Bind `render.visual` and `numericClaims` before approval. Preserve limitations when adapting layouts; portrait currently rejects background video and original-image evidence panels.

## Choose the work that is actually needed

- For new audio, inventory the existing episode first. Preserve originals, raw transcription, trims and prior approved outputs. Use `studio init` and `studio import` with explicit external paths; import returns a new manifest revision. Do not overwrite a previous episode or choose a new engine by default.
- For subtitle changes, retain cue-level original/corrected text and reasons. Run `studio audit`; treat its suggestions as candidates. Numbers, signs, years and units need primary-source and audio review. ASR consensus does not establish an audible error. Follow any already-authorized retained-voice policy; otherwise resolve the treatment of a confirmed material spoken error before delivery. Never imply that corrected subtitles repair the voice.
- For new narration versions, use `studio compare BEFORE_MANIFEST AFTER_MANIFEST NEW_OUTPUT` after transcription. Review changes to numbers, dates, units and affected scenes. It compares transcripts and declared audio hashes, not the speech or actual audio bytes; unchanged transcripts with a changed voice hash require new transcription/listening work.
- For visuals, map important spoken numbers to sources, units, periods, cue IDs and chart targets. Pick a metric, comparison, trend, process or evidence template according to the explanation. Inspect mapping yourself: a numeric cue with an event is not proof of numeric coverage. Illustrations provide context, not fabricated evidence. Keep source and estimate labels visible.
- For covers, place headline, subtitle, series and optional licensed image reference in manifest `delivery.cover` before approval. `deliver` generates both 3:4 and 4:3 PNGs. Use explicit newlines in the headline when needed to preserve phrase boundaries. Inspect thumbnails and revise a new project snapshot if the wording or artwork changes.

## Use the code gates

Run `studio doctor`, `studio audit` and `studio timeline` before editorial approval as useful. Keep internal status in `internalNotes`, not title, captions, scenes, sources or cover text. Formal delivery must preserve audience-relevant limitations while excluding internal workflow notes.

Run `studio review-page MANIFEST COMPLETED_BUILD NEW_OUTPUT` for clickable cue/issue/source review of the matching native build. Keep this internal page separate from public delivery. Reuse a stable cache across revisions; use a fresh output after failure. Do not remove an active, unknown, foreign or abandoned guard lock to force a retry.

Follow the exact-snapshot review flow in the repository docs. Reuse existing user authorization when it actually covers the current content and changes; do not invent approval or request the same approval again. Importing polish is not approval, and changes to bound inputs or rendering code can invalidate an earlier approval.

Use `studio render MANIFEST APPROVED_REVIEW NEW_BUILD CACHE`, then `studio deliver MANIFEST APPROVED_REVIEW BUILD NEW_DELIVERY`. These are arguments after `npm run studio --` from the repository. Use absolute external paths, fresh outputs and a stable episode cache. Do not retry a failed delivery over its partial directory. A standalone or legacy custom-adapter MP4 is not automatically a native build; preserve it and report compatibility limits rather than fabricating a build receipt.

## Finish with evidence

Inspect images, subtitle boundaries, animation intermediate states and seeking. Inspect audio where listening is available and state the actual listening status. Deliver public MP4, SRT, title and both covers only after `delivery.json` exists and its hashes match. Keep `internal/` records separate. Report concrete paths, passed checks and material unresolved issues; never equate decode success with factual verification or human listening. Publishing is a separate action requiring the user's authorization.

