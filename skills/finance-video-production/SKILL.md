---
name: finance-video-production
description: Prepare or revise finance explainer videos from narration, manuscripts and research using the finance-video-studio project, including numeric visuals, subtitles, covers and formal delivery.
---

# Finance video production

Use the existing repository pipeline instead of recreating per-episode export scripts. Locate `finance-video-studio` from the working context or explicitly configured code root; ask for its location only if neither is available. Read its `AGENTS.md`, `docs/production-workflow.md` and the applicable language version of `docs/editorial-review.md`. For command contracts, read `docs/production-tools.md`, `docs/production-rendering.md` and `docs/production-delivery.md` in that repository. Repository code and docs are authoritative for supported formats.

For native portrait, caches, numeric evidence and review pages, read `docs/production-advanced.md`. Choose explicitly between 1920×1080/30 and 1080×1440/60; do not crop a landscape scene or silently map legacy HTML. Bind `render.visual` and `numericClaims` before approval. Preserve limitations when adapting layouts; portrait currently rejects background video and original-image evidence panels.

## Persistent defaults and resuming old work

Read `docs/production-profile.md` before initializing or resuming an episode. New `studio init` projects use `portrait-explainer-v1`: 1080×1440/60, warm-paper broadcast, subtle background motion and cue-linked reveals. This versioned code profile is authoritative for those defaults; do not rely on chat memory. Read any explicitly configured `CONFIG_ROOT/projects/finance-video-studio/production-preferences.json` for the owner's reference episode and local production context; it is not automatically read by the CLI.

An older manifest without `productionProfile` is legacy input, not evidence that its landscape dimensions or complete raw soundtrack are the owner's current preference. Resolve its profile warning before presenting resumed work as ready. Converting 30fps to 60fps requires retiming scenes, cues, events and chapters through seconds; changing only width/height/fps is wrong. Use an explicit new manifest revision and preserve old approvals with their source revisions.

“Retain the original voice” preserves spoken performance; it does not automatically mean retaining a service introduction or outro music. Inventory the original audio, propose per-episode source cut points, save a distinct derived audio and retime the full timeline. Store the explicit trim or reasoned full-track decision in `productionProfile.audioEdit`; uncertain speech boundaries still require listening. The edit record is not human listening or rendering approval. Never apply a fixed number of intro/outro seconds to every episode.

Background `subtle` motion is not explanatory animation. Give every visual target a resolved cue-linked `reveal` of at least 0.2 seconds, normally about 0.6 seconds and longer for a curve or multi-step explanation. Inspect intermediate growth/tracing and reverse seeking. Keep final financial values exact rather than presenting interpolated values as measured data.

Keep one episode's inputs directory and a stable scene cache across revisions. Add manifest revisions and only genuinely new derived assets; do not clone a complete episode directory for every review. `studio import` reuses matching same-type project assets only after hashing their actual bytes. Mark shared historical deduplicated assets immutable and write revisions to new files; never overwrite a shared hardlink in place. Distinguish retained evidence from disposable test caches before authorized cleanup.

## Choose the work that is actually needed

- For new audio, inventory the existing episode first. Preserve originals, raw transcription, trims and prior approved outputs. Use `studio init` and `studio import` with explicit external paths; import returns a new manifest revision. Do not overwrite a previous episode or choose a new engine by default.
- For subtitle changes, retain cue-level original/corrected text and reasons. Run `studio audit`; treat its suggestions as candidates. Numbers, signs, years and units need primary-source and audio review. ASR consensus does not establish an audible error. Follow any already-authorized retained-voice policy; otherwise resolve the treatment of a confirmed material spoken error before delivery. Never imply that corrected subtitles repair the voice.
- For new narration versions, use `studio compare BEFORE_MANIFEST AFTER_MANIFEST NEW_OUTPUT` after transcription. Review changes to numbers, dates, units and affected scenes. It compares transcripts and declared audio hashes, not the speech or actual audio bytes; unchanged transcripts with a changed voice hash require new transcription/listening work.
- For visuals, map important spoken numbers to sources, units, periods, cue IDs and chart targets. Pick a metric, comparison, trend, process or evidence template according to the explanation. Inspect mapping yourself: a numeric cue with an event is not proof of numeric coverage. Illustrations provide context, not fabricated evidence. Keep source and estimate labels visible.
- For covers, place headline, subtitle, series and optional licensed image reference in manifest `delivery.cover` before approval. `deliver` generates both 3:4 and 4:3 PNGs. Use explicit newlines in the headline when needed to preserve phrase boundaries. Inspect thumbnails and revise a new project snapshot if the wording or artwork changes.

For pre-approval inspection, use `studio preview MANIFEST NEW_OUTPUT SHARED_REVIEW_ASSET_CACHE` for native portrait with unmixed/un-normalized narration. It shares hashed font/renderer files, keeps audio in the episode inputs, draws actual intermediate states and exposes source intro/outro controls. It is an internal live preview, not an encoded build, approval or final verification. Its visual adjustment panel is for layout-only corrections: export a patch and run `studio patch MANIFEST PATCH NEW_MANIFEST` to create a new revision. Do not recreate per-episode HTML snapshot exporters or clone audio/font files merely to produce another preview.

## Use the code gates

Run `studio doctor`, `studio audit` and `studio timeline` before editorial approval as useful. Keep internal status in `internalNotes`, not title, captions, scenes, sources or cover text. Formal delivery must preserve audience-relevant limitations while excluding internal workflow notes.

Run `studio review-page MANIFEST COMPLETED_BUILD NEW_OUTPUT` for clickable cue/issue/source review of the matching native build. Keep this internal page separate from public delivery. Reuse a stable cache across revisions; use a fresh output after failure. Do not remove an active, unknown, foreign or abandoned guard lock to force a retry.

Follow the exact-snapshot review flow in the repository docs. Reuse existing user authorization when it actually covers the current content and changes; do not invent approval or request the same approval again. Importing polish is not approval, and changes to bound inputs or rendering code can invalidate an earlier approval.

Use `studio render MANIFEST APPROVED_REVIEW NEW_BUILD CACHE`, then `studio deliver MANIFEST APPROVED_REVIEW BUILD NEW_DELIVERY`. These are arguments after `npm run studio --` from the repository. Use absolute external paths, fresh outputs and a stable episode cache. Do not retry a failed delivery over its partial directory. A standalone or legacy custom-adapter MP4 is not automatically a native build; preserve it and report compatibility limits rather than fabricating a build receipt.

## Finish with evidence

Inspect images, subtitle boundaries, animation intermediate states and seeking. Inspect audio where listening is available and state the actual listening status. Deliver public MP4, SRT, title and both covers only after `delivery.json` exists and its hashes match. Keep `internal/` records separate. Report concrete paths, passed checks and material unresolved issues; never equate decode success with factual verification or human listening. Publishing is a separate action requiring the user's authorization.

