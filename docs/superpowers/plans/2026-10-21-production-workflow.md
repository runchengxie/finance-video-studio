# Finance Video Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver the approved reusable production workflow, bilingual documentation, improved synthetic videos and pending historical adaptations.

**Architecture:** Retain v1 unchanged and add a strict v2 production pipeline using the existing TypeScript/Playwright/SVG/FFmpeg stack. Scene compilation, review snapshots and media verification share validated contracts. Four sequential PRs deliver documentation, production tools, reviewed rendering, then voice/adoption.

**Tech Stack:** Node >=24, locked npm dependencies, FFmpeg/ffprobe, pinned Playwright Chromium and Noto Sans SC; Python 3.12 for documentation and optional tooling.

**Spec:** [Approved design and documentation extension](../specs/2026-10-20-production-workflow-design.md).

## Global Constraints

- Preserve all existing v1 commands, schemas, fixed fixtures and three-point review behavior.
- Use `schemaVersion: 2`; 30 fps, 1920×1080 output and integer `durationFrames`.
- No publishing, paid service, new transcription-model download or automatic editorial approval is included.
- Private manuscript, media and research never enter this repository.
- Production rendering requires current human approval bound to actual input bytes and the complete editorial snapshot.
- Outputs, caches, reports and build artifacts use explicit external locations; creation never overwrites existing deliverables.
- Deterministic production tests and rendering execute without network access.
- MkDocs 1.6.1, Material 9.7.7, static-i18n 1.3.1; English default and Simplified Chinese selection; no documentation deployment.

## Review Focus

1. Windows drive-relative paths and junction escapes must not redirect writes into inputs or source; Task 2 tests these cases.
2. A declared hash can remain unchanged while input bytes change; Tasks 3 and 6 reject stale content before output creation and assembly.
3. Millisecond-to-frame rounding can create subtitle collisions; Task 4 rejects affected cue IDs instead of shifting speech.
4. A partial/corrupt cached segment can look complete; Task 8 verifies the receipt and actual media before reuse.
5. Locale URLs can break under a GitHub-style repository prefix; Task 1 inspects both languages under `/finance-video-studio/`.

## PR A — Documentation

### Task 1: Bilingual docs and repository layout

**Files:** Move `THIRD_PARTY.md` → `docs/third-party.md`, `VALIDATION.md` → `docs/validation.md`; modify `README.md`, `.gitignore`, `.github/workflows/ci.yml`; create `mkdocs.yml`, `docs/requirements.in`, `docs/requirements.txt`, `docs/index.md`, `docs/repository-structure.md` and `.zh.md` translations for every public guide.

**Interfaces:** Existing English guide paths remain valid. `python -m mkdocs build --strict --site-dir ABSOLUTE_EXTERNAL` builds the site. Node config files remain in the repository root; the structure guide links to them rather than maintaining copies.

- [x] Move the two prose files and repair references; preserve validation dates and dependency notices. Translate actual implemented behavior, distinguishing this plan from shipped features.
- [x] Configure suffix i18n (`en` default, `zh` alternative), translated navigation, local assets, `font: false`, no analytics, and excluded internal planning pages. Root README links to the docs home and explains the standard config locations.
- [x] Compile a fully pinned dependency lock from the three exact top-level versions for Python 3.12, install in an external task venv, and build strictly to a new external directory.
- [x] Inspect generated English/Chinese home, review and license pages; assert language alternates resolve under a repository URL prefix, both search indexes exist, local links resolve and no remote font/CDN references are emitted. Add the strict docs build to CI after dependency provisioning.
- [x] Run `npm run check`, `npm test`, strict docs build and link checks; commit and request review. Merge after current-target checks, then continue the next PR from merged main.

## PR B — Contracts and tools

### Task 2: Manifest and path boundaries

**Files:** Create `src/production/manifest.ts`, `src/production/paths.ts`, `test/production-manifest.test.ts`, `test/production-paths.test.ts`, `examples/production.json`.

**Interfaces:** `manifestSchema` exports Zod-derived `ProductionProject`, `InputAsset`, `Scene`, `Cue`, `Event`, `Source`, `ManuscriptBlock`, `RenderSettings` types. `parseProject(value: unknown): ProductionProject` performs structural/reference checks. Async `resolveInput(projectFile: string, relative: string): Promise<string>` and `assertOutput(projectFile: string, output: string): Promise<void>` enforce actual filesystem boundaries.

Contract limits: JSON input at most 16 MiB; IDs match `[A-Za-z0-9][A-Za-z0-9_-]{0,79}`; title at most 120 characters, manuscript blocks 8000 characters, cue text 180 characters, labels 80 characters and provenance/rights notes 4000 characters. Allow at most 2000 inputs, 1000 sources, 500 manuscript blocks, 500 scenes, 20000 cues and 50000 events; duration is 1–108000 frames. Event duration is 1–300 frames and offset is an integer within ±108000, with the resulting event interval contained in its scene. Chart values must be finite with absolute value at most 1e15; bar comparisons require nonnegative values, waterfall/trend data supports signed values. Template-specific shape/reference checks remain mandatory.

- [x] Write failing tests for unknown fields/duplicate IDs, gaps/overlaps, missing references, signed-data units and nonfinite values. Assert `parseProject({...fixture, fps: 29.97})` throws and the committed complete synthetic fixture parses.
- [x] Write path tests using external temp directories: `../escape`, absolute inputs, URL inputs, drive-relative `D:foo`, a linked input escaping `inputs/`, and a linked output ancestor into checkout/inputs all reject. Valid C-to-D paths accept on Windows; use `path.win32` unit cases on every platform. Skip OS link creation only for explicit permission failures and report skips.
- [x] Run the focused tests and observe expected failures before implementing strict contracts and realpath/nearest-ancestor checks. Define template-specific data for metric, comparison, waterfall, trend, process and evidence; bound all strings/arrays, require explicit source/target IDs and contiguous scene/chapter intervals.
- [x] Run the focused tests and full check/test suite; commit the verified contracts.

### Task 3: Project revisions, input snapshots and doctor

**Files:** Create `src/production/project-io.ts`, `src/production/snapshot.ts`, `src/production/doctor.ts`, `src/studio-cli.ts`, `test/production-project.test.ts`; modify `package.json`.

**Interfaces:** `initializeProject(directory: string): Promise<void>` creates a clearly pending skeleton. `importAsset(manifestFile: string, source: string, inputId: string): Promise<string>` returns a new revision path. `snapshotProject(manifestFile: string): Promise<EditorialSnapshot>` computes actual input hashes; define/export `EditorialSnapshot` in `snapshot.ts`. `doctor(manifestFile: string): Promise<DoctorReport>` returns `{ok, diagnostics}` with stable codes; define/export `DoctorReport`. `npm run studio -- init|import|doctor` implements the spec's argument forms and exit codes.

- [x] Write failing tests asserting an existing init destination and reused revision path are refused; imported bytes match originals; import collision/failure cannot mark a revision valid; changed bytes fail despite an unchanged declared hash; missing file/tool gets its specific diagnostic.
- [x] Assert doctor leaves directory/file hashes unchanged and never launches rendering/SAPI. CLI invalid args exit 2; unavailable tool exits 3; no manifest-supplied shell string is executable.
- [x] Implement exclusive creation, explicit import receipts, SHA-256 snapshots and shell-free version probes. Read only explicitly provided environment roots or an explicitly supplied workspace TOML; support ordinary absolute-project use without root configuration. Incomplete skeletons report actionable diagnostics.
- [x] Run focused tests and CLI init/import/doctor on synthetic external data, then full check/test; commit.

### Task 4: Shared timeline and exports

**Files:** Create `src/production/timeline.ts`, `src/production/subtitle-exports.ts`, `test/production-timeline.test.ts`; extend `src/studio-cli.ts`.

**Interfaces:** `parseSrt(text: string, fps: 30): Cue[]`, `validateTimeline(project: ProductionProject): void`, `exportTimeline(project: ProductionProject, output: string): Promise<void>` produce create-only `subtitles.srt`, per-scene ASS, `chapters.ffmeta`, `storyboard.md`.

- [x] Write failing tests for BOM/CRLF/multiline cues, malformed timestamps, overlapping/order/out-of-bounds intervals and frame rounding. Explicitly assert 1–31ms maps to frames `[0,1)` and adjacent millisecond cues colliding after floor/ceil raise a diagnostic identifying both IDs.
- [x] Test missing/unresolved animation targets, chapter discontinuity and zero durations. Test `{`, `}`, backslashes/newlines in subtitle and chapter text produce escaped output rather than extra ASS/metadata instructions.
- [x] Implement validated half-open intervals, floor starts/ceil ends and deterministic exported time formatting. No guessed word timings or silently shifted cues.
- [x] Run timeline CLI on the synthetic fixture into a new external directory, inspect exports, run check/test and commit.

### Task 5: General media verification and tool reports

**Files:** Create `src/production/media.ts`, `src/production/verify.ts`, `test/production-verify.test.ts`, `test/production-tools-smoke.ts`; extend studio CLI and CI.

**Interfaces:** Export strict `mediaExpectationsSchema`, derived `MediaExpectations`, and `VerificationReport`. `verifyMedia(file: string, expected: MediaExpectations): Promise<VerificationReport>` probes/counts/decodes and returns every check result. CLI exclusively saves the report and exits 4 for media mismatch, 3 for unavailable/failed tools, 2 for bad input.

- [x] Write failing tests using a tiny FFmpeg-created synthetic video/tone: correct properties pass; wrong dimensions/frame count/audio/chapters fail with named checks; corrupt/truncated media fails decode. Existing reports are not overwritten.
- [x] Generate a clip with deliberate black/silent intervals; test configured allowed intervals pass and unexpected intervals fail. Preserve scan events, thresholds, measured loudness, tool versions, input hash and explicit `manualListening: false` without implying fact verification.
- [x] Implement shell-free bounded tool execution with explicit errors, frame counting, tolerances, optional scans and safe JSON report creation.
- [x] Run actual tool smoke offline plus existing check/test/smoke/review example. Add new smoke to offline CI, review PR B against current main, merge and clean its completed task branch/worktree.

## PR C — Reviewed production and visual sample

### Task 6: Long-form review envelope

**Files:** Create `src/production/review.ts`, `src/production/review-io.ts`, `test/production-review.test.ts`; extend studio CLI; keep `src/review.ts` and v1 CLI behavior compatible.

**Interfaces:** Export `ProductionReview`, `ProductionApprovalOptions`; `createProductionReview(snapshot: EditorialSnapshot): ProductionReview`, `importProductionPolish(record: ProductionReview, result: unknown): ProductionReview`, `approveProductionReview(record: ProductionReview, options: ProductionApprovalOptions, now?: Date): ProductionReview`, `assertProductionApproved(snapshot: EditorialSnapshot, record: ProductionReview, now?: Date): void`. Save review revisions exclusively; commands are `studio review init|import|approve|status` with explicit approval confirmation.

- [x] Write failing tests: full manuscript beyond v1 limits survives; pending/rejected/expired/future-issued records cannot render; import never approves; added/deleted manuscript or cue IDs appear in diffs; changed source/number/unit/qualifier needs review; altered facts/timing/inputs cannot enter through text polish.
- [x] Assert edited envelope, stale declared or actual input hashes and a v1 envelope all reject. Editing cached status never grants approval; no executable adapter is inferred or automatically invoked.
- [x] Implement canonical full snapshot/review hashes, policy-bound differences and manual explicit approval. Content-affecting changes require new snapshots. No generic skip-review path is introduced.
- [x] Run focused and unchanged v1 regression tests, full check/test, and commit.

### Task 7: Six templates, events and visual checks

**Files:** Create `src/production/design.ts`, `src/production/locales.ts`, `src/production/templates.ts`, `src/production/scene-state.ts`, `test/production-scenes.test.ts`, fixed template fixtures under `examples/production/`.

**Interfaces:** Export typed `designTokens` and English/Chinese label catalogs. `sceneState(project: ProductionProject, sceneId: string, frame: number): SceneState` deterministically resolves events; define/export `SceneState`. `sceneHtml(project: ProductionProject, sceneId: string, frame: number, fontCss: string): string` renders the six strict template variants and caption/qualifier/source layers.

- [x] Write failing tests for before/during/after reveal/highlight/compare/annotate, cue-offset boundaries, missing targets and escaped user text. Identical frame inputs produce identical state/markup; comparisons retain zero baselines, waterfall values reconcile and trends show explicit units/time intervals.
- [x] Implement tokens and layouts with one principal focus per stage, directly connected comparison differences, persistent object geometry and captions whose background disappears when absent. Every UI string uses the selected locale; default English, explicit Chinese choice.
- [x] Render every template plus event intermediate frames using the pinned browser/font offline. Automatically reject missing font, out-of-frame text and caption collisions, including long synthetic Chinese and large signed values; retain 360/390px previews for actual visual inspection.
- [x] Run focused tests/checks and inspect retained frames. Commit after correcting any material layout issues.

### Task 8: Stage compilation, verified cache and assembly

**Files:** Create `src/production/stages.ts`, `src/production/cache.ts`, `src/production/render.ts`, `src/production/assemble.ts`, `test/production-cache.test.ts`, `test/production-render.test.ts`.

**Interfaces:** `compileStages(project: ProductionProject): Stage[]` exports typed `Stage` with absolute-frame interval and animation/hold spans. `renderProduction(manifestFile: string, reviewFile: string, output: string, cache: string): Promise<BuildReport>` defines/exports `BuildReport`. Cache functions accept a typed content/version fingerprint and expose hit/miss reasons, not arbitrary path execution.

- [x] Write failing tests: stage intervals exactly cover scenes, multiple events inside one scene retain timing, changed stage/audio/subtitle/template/lock/tool settings invalidate keys; absent receipt, corrupt segment and interrupted temp write are misses.
- [x] Assert pending review rejects before any output/cache mutation, current approval is rechecked before assembly, a nonempty output rejects, and final creation cannot overwrite an existing file. Include changed-on-disk inputs between phases.
- [x] Implement browser-rendered deterministic animation spans, FFmpeg static holds and shared-timeline subtitles. Atomically publish only verified cache entries on the same volume; validate actual cached media before reuse.
- [x] Assemble validated stages, explicitly selected/normalized audio and chapters; verify duration/count/codecs/full decode. Record stage hits/misses, tools, input hashes, timings and failure state. Expose `studio render` with mandatory review and explicit destinations.
- [x] Run the production smoke and old render/review smoke offline; commit.

### Task 9: Fixed comparison sample and release checks

**Files:** Create `src/production/demo.ts`, `test/production-example.ts`, pinned synthetic fixtures in `examples/production/`; extend scripts, CI and bilingual guides.

**Interfaces:** `renderProductionDemo(output: string, variant: 'improved'|'legacy-comparison'): Promise<void>` only loads source-pinned complete fixtures. CLI accepts output and a closed fixture variant, not arbitrary manifest/audio input. Fixture runtime audio is generated from a pinned tone recipe until the optional local-voice task.

- [x] Pin the complete 36-second fictional sample and both comparison variants with identical values, output dimensions, cue timings and audio. Include comparison, waterfall, process and trend; use focused fixtures to cover metric/evidence templates.
- [x] Test modified fixture content, arbitrary project path/audio and fictional-only bypass attempts reject. Verify fixed demo access cannot reach the generic unreviewed renderer.
- [x] Produce both videos, intermediate/representative frames, contact sheets, phone previews and cold/warm-cache timing reports outside Git. Inspect complete clips and frames; record observed readability/focus changes and actual performance without claiming listening or factual review.
- [x] Add the short production smoke to offline CI. Run check/test, old smoke/review example, production tests, strict bilingual docs build; review/merge PR C against current target and clean completed branches/worktrees.

## PR D — Voice and historical adoption

### Task 10: Explicit local SAPI and stable input imports

**Files:** Create original `scripts/sapi.ps1`, `src/production/voice.ts`, `test/production-voice.test.ts`; extend studio CLI and bilingual guides.

**Interfaces:** `generateVoice(manifestFile: string, options: {voice: string; output: string; executeLocal: boolean}): Promise<VoiceProposal>` defines/exports `VoiceProposal` with measured clips, proposed cues and review-required status. Unsupported OS or unavailable selected voice reports failure; no automatic fallback provider.

- [x] Write failing tests that omitted explicit execution, non-Windows execution and unavailable voices never synthesize or mutate inputs. Test existing output refusal and that audio changes cannot retain approval or old cue timing silently.
- [x] Implement locally selected SAPI voice execution in a hidden process with short UTF-8 text clips, measured duration and proposed frame-aligned cues. New audio/timeline needs a new editorial snapshot; do not manufacture approval or claim human pronunciation review.
- [x] Explicitly generate fixed synthetic narration for the comparison sample on this machine, bind the same audio to both variants and inspect the produced audio/video. Keep CI tone-only and offline; document synthetic narration and remaining human listening requirements. Run platform-appropriate tests and commit.

### Task 11: Historical adapters and adoption receipts

**Files:** Create `src/production/adapters/{fixed-sample,full-timeline,external-audio}.ts`, `src/production/adapt.ts`, `test/production-adapters.test.ts`; synthetic fixtures under `test/fixtures/production-adapters/`.

**Interfaces:** `adaptHistorical(kind: 'fixed-sample'|'full-timeline'|'external-audio', sourceDirectory: string, destination: string): Promise<AdaptationReport>` defines/exports `AdaptationReport` with copied-input hashes, mappings, unsupported features and pending review path. Only explicit known formats are accepted.

- [x] Write failing tests for all three synthetic legacy formats; original bytes remain unchanged, paths and input copies match hashes, wrong format/missing input fails, unknown template mapping is reported and blocks readiness, and historical authorization cannot become a v2 approval.
- [x] Implement adapters using the six templates only when semantics match. Reports include textual/data/timing/visual differences and unresolved mapping IDs; never guess missing facts or apply company-specific typo replacements globally.
- [x] Adapt the known local sample, full film and external-audio project into new task directories. Copy selected Downloads audio into stable new inputs with provenance while leaving old authorization and outputs unchanged. Validate all hash mappings and produce pending reviews; request exact editorial approval only if historical rerendering is subsequently requested.
- [x] Update bilingual migration/production guides and local project catalog/navigation. Run full tests, offline acceptance, strict docs build and independent review; merge PR D after applicable combined checks.

## Final verification and handoff

- [ ] Confirm all four PRs are merged and primary main is clean/current; run merged-main checks and confirm task-related CI. Deployment is absent unless separately requested.
- [ ] Check all original artifacts/authorizations retained, adapted-project reports honest, and visual/sample artifacts linked from the local workspace index. List pending human editorial/listening work explicitly.
- [ ] Remove only completed task remote/local branches and worktrees after merged commits and unique files are verified. Report PRs, commits, actual tests and sample paths; never label pending historical projects as finished new films.


