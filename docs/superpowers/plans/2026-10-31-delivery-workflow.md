# Delivery workflow implementation plan

> Execute inline using superpowers:executing-plans. Review the complete change before integration.

Goal: turn confirmed production defaults into tested commands and an installed finance-video-production skill.
Architecture: extend the existing v2 manifest with optional internal records and bound cover settings; add audience preflight and an approved-build delivery packager. Reuse existing approval, media verification, timeline export, fonts and asset checks. Do not change format support or migrate legacy real inputs implicitly.
Tech stack: TypeScript, Zod, Playwright, FFmpeg, Markdown skill.
Spec: user-approved code plus skill split; formal videos omit internal notes, retain material caveats, ship MP4/subtitle/two covers with separate internal records. No automatic factual corrections or publishing.

- [x] Test audience-note separation, subtitle candidates and numeric-event coverage.
- [x] Implement preflight and enforce it before real rendering.
- [x] Test and implement approved-build delivery with dual-ratio covers, revalidation, immutable output and hashes.
- [x] Document commands and limits; create and validate discoverable skill.
- [x] Run checks, tests, render smoke, review example and strict docs; independently review. Integration, deployment and cleanup are tracked by the task PR.

Ruling: no broad engine migration; native delivery remains 1920x1080/30. Legacy custom portrait exports remain intact. Exact numerical alignment is reported as a review candidate, not factual verification. Existing stage cache is reused unchanged.

Validation: 71 tests passed; check, rendered smoke, review example and strict bilingual docs passed. Skill validator passed. Independent review found two issues; regressions were observed failing, fixed, and passed. A real native render now precedes successful delivery testing. Chinese illustrated covers were visually inspected.
Skill baseline already followed repository docs; no baseline failure was invented. The skill adds routing and decision guidance, not new authorization.

