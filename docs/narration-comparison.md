# Narration version comparison

Run `npm run studio -- compare BEFORE_MANIFEST AFTER_MANIFEST NEW_OUTPUT_DIRECTORY` with absolute external paths. The output directory must be new. The command preserves both source files and writes byte snapshots, `comparison.json`, and a readable `index.html`.

This compares validated manifests and transcript cues. It does not listen to audio, perform speech recognition, verify spoken words or facts, grant approval, or render a video. Audio hashes are **declared metadata only** (`comparison: declared_only`, `verified: false`); audio files are not opened. Changed or missing audio hashes with unchanged transcript require retranscription and manual listening/review.

The report aligns cue sequences to avoid marking the whole tail as changed after an insertion or deletion. It identifies added, removed, changed and retimed cues; old and new impacted scenes; numeric scene claims; and changed number, date, unit and financial-term tokens. These are review prompts, not judgments that a claim is true or false. Timing uses each manifest's own frame rate. Duration reports project timeline metadata, not measured audio duration.

Alignment is limited to four million matrix cells and rejects larger comparisons before creating output. Split large manuscripts into smaller reviewable versions. No network access or unrelated workspace configuration is required.
