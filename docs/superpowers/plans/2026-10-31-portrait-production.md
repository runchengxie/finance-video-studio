# Portrait production and review implementation plan

> Use focused parallel agents for independent ledger/review and narration-diff modules; root integrates rendering, format and cache changes. Fresh whole-branch review before merge.

**Goal:** make the actual portrait workflow reusable, cache unaffected scenes, link financial claims to evidence, and provide seekable review and narration-version comparison.
**Architecture:** extend the existing approved v2 project contract with a portrait output profile, optional visual preset and numeric claim records. Keep native rendering/cache/delivery guards; add internal review and comparison artifacts. Preserve existing real projects and outputs.
**Tech Stack:** TypeScript, Zod, Playwright, FFmpeg, local HTML, existing original skill.
**Spec:** the user approved all six improvements in the preceding proposal; details in this plan and the shipped workflow documentation.

- [x] Add tested 1080x1440/60 output with portrait-native readable layout and correct subtitle/chapter/audio time bases.
- [x] Fingerprint visual dependencies by scene; reuse verified unaffected stages across reviewed revisions, with fresh output directories after failures.
- [x] Add optional warm-paper/navy visual profiles shared by video and covers, deterministic subtle motion and safe layout.
- [x] Add validated numeric evidence ledger and honest visual mismatch/coverage report.
- [x] Add local seekable review export with hashes, cue links, issues and sources.
- [x] Add bounded transcript/audio-manifest version comparison with affected scenes and no claims of listening or ASR.
- [x] Wire commands, update bilingual docs and skill; run required checks, native portrait integration, independent review, CI, merge, deploy, install skill and clean only task branches.

Constraints: original code/synthetic fixtures only in public repo; private/generated artifacts external. Human exact-snapshot approval remains mandatory for real rendering. No implicit conversion or overwrite of legacy episode data. New format selection is explicit, not a crop of a landscape frame.

Validation: 90 tests passed after substantive fixes; check, smoke, review example and strict bilingual documentation build passed. A 360-frame original fictional portrait video was rendered, decoded, reviewed and packaged; three representative scene frames were inspected. Independent review found cache cue closure, lock recovery race and portrait presentation/emphasis omissions; observed-red regressions passed after fixes. Integration/deployment and task cleanup are tracked by the PR.

Final time-base sweep also found and fixed optional local-voice padding at 60 fps; its regression was observed failing before the fix. Native landscape background-video timing and closed legacy adapters deliberately remain 30 fps.
