# Persistent production defaults

The selected approach combines a versioned code profile, preflight checks, and the existing project production skill. Documentation alone cannot prevent a new project from silently inheriting landscape, static-only charts and unrecorded full audio. Preserve explicit legacy manifests; report their missing profile rather than rewriting them.

## Requirements

New projects use the generic `portrait-explainer-v1` profile: 1080×1440 at 60 fps, warm-paper broadcast styling, subtle continuous background motion, and cue-linked visual reveals. This is an explanatory animation contract, not a promise that a moving background establishes numeric synchronization. Each substantive scene must have cue-linked reveals for its visual targets.

An explicit audio-edit decision must identify either retained full audio with a reason, or a source audio, derived selected track, source interval and notes. Pending decisions block a profiled real production. Declared trims are not human listening or editorial approval. All profile and edit fields belong to the exact snapshot. Keep originals and never assume a fixed intro/outro duration across episodes.

Reuse identical verified assets inside an episode instead of copying them for each revision. Do not use cross-project symlinks or silently share writable files. No automatic deletion is introduced.

## Implementation

- [x] Add `src/production/profile.ts`: strict profile schema and actionable diagnostic checks; integrate into manifest parsing, doctor and render/delivery readiness.
- [x] Make `initializeProject` choose the profile, with an explicit CLI `--profile legacy-landscape` option for the old scaffold. Existing manifests keep their own format.
- [x] Use actual progress for portrait line tracing and waterfall growth; retain exact final labels and deterministic seeking.
- [x] Make `importAsset` reuse hash-matching, same-type, actually verified existing project assets, retaining import receipts and fresh manifest revisions.
- [x] Add meaningful failing tests first: defaults, explicit legacy mode, pending/invalid trims, format/style/reveal drift, tampered reused inputs and intermediate motion states. Run them before fixes.
- [x] Add the reusable `studio preview` portrait inspection command: native time-driven browser rendering, separate English/Chinese catalogs and one hash-addressed shared font/renderer asset cache; never encode or approve a real manuscript. Pin the already-used esbuild version explicitly for the browser bundle.
- [x] Update the English/Chinese command docs, production skill and repository entry instructions so a fresh clone discovers this contract without machine-private paths or real episode content.
- [ ] Run required static, full offline, smoke and review/example checks, obtain independent review, merge only the reviewed current result with passing CI, verify deployment and clean only this worktree.

External episode follow-up: prepare a fresh portrait proposal from the current episode using the same inputs directory, record source-based intro/outro cut proposals and retimed cues/events, inspect actual portrait frames, and retain pending review. Keep private references and all generated media under DATA_ROOT. Separate inventory and safe slimming of historical data from production code; retain an auditable cleanup record.
