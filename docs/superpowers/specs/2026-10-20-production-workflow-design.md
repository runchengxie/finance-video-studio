# Reusable finance-video production workflow

Status: production-pipeline design approved by the user on 2026-10-21. Implementation-plan review is pending. The documentation extension below reflects the user's additional request on that date.

## Outcome and scope

Turn the repeated local production steps into a supported workflow in this repository: initialize a project, import its licensed local inputs, validate its timeline, review exact content, render scenes, assemble chapters and audio, and verify the resulting video. Provide a visibly improved synthetic comparison sample and explicit adapters for historical projects. Keep original manuscripts, evidence and outputs intact.

This is one production pipeline delivered in three sequential releases. Release 1 establishes project manifests, input snapshots, preflight, timeline tools and media verification. Release 2 adds reviewed multi-scene production, visual templates, caching and the comparison sample. Release 3 adds local speech support and historical adapters. Each release has its own validation and reviewed PR; later releases depend only on merged interfaces.

No publishing, paid service, new transcription-model download or automatic editorial approval is included. Human listening, source interpretation and a decision to publish remain human tasks. Imported historical authorization is provenance, not approval of a newly transformed project.

## Technical direction

Three approaches were considered:

1. Extend the existing TypeScript, Playwright, SVG and FFmpeg stack. This preserves the pinned browser/font environment, offline checks and review boundary. It requires original scene templates, which are already needed for the visual improvements. Recommended.
2. Promote the standalone Remotion projects into the public package. This reuses experimental rendering conventions, but also introduces a second dependency and licensing model and does not solve their incompatible manifests or task-specific authorization checks.
3. Adopt Motion Canvas or Manim as the production engine. These offer useful explanatory-animation ideas, but engine migration adds installation and integration work before addressing the repeated local workflow.

Use approach 1. Learn event-based timing and persistent visual objects from the references already inspected; do not copy third-party scene code. No new runtime package is required initially. Preserve all existing v1 commands, schemas, fixed fixtures and three-point review behavior.

## Release 1: project contract and production tools

### Project layout and paths

New projects use an explicit external directory with `project.json`, `inputs/`, `reviews/` and `builds/<build-id>/`. Inputs are immutable copies imported by an explicit command, with original location and SHA-256 retained in an import receipt. Existing files are never overwritten. A failed import leaves a recorded incomplete operation and cannot become a valid project implicitly.

The code accepts an absolute project directory and resolves project-relative input paths. Reject drive-relative paths, network URLs, escaping paths and links resolving outside the project inputs. Resolve the nearest existing ancestor of an output location to prevent symlink/junction traversal back into the checkout or into inputs. Cache, temporary and final output paths must also be outside the source repository. Cross-drive Windows paths remain supported.

Machine roots are resolved from explicitly supplied environment values or a supplied workspace TOML; there is no hard-coded personal path or automatic search for private configuration. Explicit project paths remain sufficient without machine-root configuration.

### Manifest v2

Use `schemaVersion: 2` and strict, bounded fields:

- Project ID, title, content language, `fictional`, 30 fps, 1920×1080 output and integer `durationFrames`.
- Inputs with stable IDs, project-relative paths, media type, SHA-256, provenance notes and rights notes. Audio is optional; silent production is labeled explicitly.
- Sources with stable reference IDs, descriptive citations and local evidence-input references. Source URLs are retained as text and are not fetched by production commands.
- Full manuscript blocks with stable IDs, text and source IDs. No three-point or 45-character truncation is imposed on v2.
- Scenes with stable IDs, `from`, `durationFrames`, template, title, optional chapter ID and strict template-specific data.
- Cues with stable IDs, text and half-open `[startFrame,endFrame)` intervals.
- Events with a scene ID, cue ID, explicit target ID, action (`reveal`, `highlight`, `compare`, `annotate`), integer offset and animation duration. Store timing precision as `cue_start`, `manually_aligned` or `unresolved`.
- Render settings and a reference to the review record. Review-file locations and build destinations are operational locations, not recursively hashed review inputs.

The editorial snapshot contains all authored content, relative input IDs and paths, their actual file hashes, facts, sources, manuscript, scene data, cues, events, template revision and content-affecting settings. It excludes approval envelopes and transient build locations. Snapshotting reads actual bytes; a declared hash alone is never accepted as proof of current input content.

Require unique IDs, valid references, complete nonoverlapping scene coverage from zero to the declared end, finite values and explicit units. Unresolved events prevent production rendering. They remain visible in inspection reports rather than receiving guessed timestamps.

### CLI contract

Use one `npm run studio -- <command>` entry with subcommands:

- `init <absolute-project-dir>` creates an empty pending project skeleton in a new directory.
- `import <project.json> <absolute-source> <input-id>` copies a selected local input, records provenance and hashes, and creates a new manifest revision. It never edits an existing bound revision.
- `doctor <project.json>` reads configuration and inputs, validates availability, paths, hashes, timeline, configured tools and pinned browser/font availability, and reports machine-readable diagnostics to stdout. It creates no files and starts no renderer.
- `timeline <project.json> <absolute-new-output-dir>` exports derived SRT, ASS, chapter metadata and a storyboard table into a fresh directory.
- `verify <absolute-video> <absolute-expectations.json> <absolute-new-report.json>` probes and decodes a video against explicit expectations. Report creation is exclusive.

All commands return 0 on success, 2 for invalid arguments/project/input state, 3 for unavailable or failed tools, and 4 for media verification failure. JSON reports carry stable diagnostic codes, severity and affected IDs; human messages describe the next corrective action. No command evaluates manifest-provided shell strings.

### Time and subtitles

Parse UTF-8 SRT with optional BOM and LF/CRLF, multiline text and explicit millisecond timestamps. Validate ordering, positive intervals and project bounds before conversion. Convert cue starts with floor and ends with ceil at 30 fps so a valid short cue is not silently deleted. Reject overlaps introduced by conversion and report affected cue IDs; never silently shift speech timing.

Generate SRT and ASS from the validated frame timeline with explicit rounding. Escape ASS control syntax and metadata delimiters. Chapters start at scene boundaries, have positive duration and cover the declared interval. Repeated chapter IDs must form one contiguous range. Animation references use cue IDs; no keyword timing is inferred from word counts.

### Media verification

Check video/audio stream presence, codecs, dimensions, pixel format, frame rate, counted frames, video/container duration tolerances and chapters. Audio presence and expected duration are explicit inputs. Full decoding uses FFmpeg error escalation. Tool versions, video SHA-256, expectations and separate results are recorded.

Optional black-frame, silence and loudness scans use explicit thresholds in expectations and preserve detected intervals. Intentional pauses must be represented by allowed intervals. Scans are signal checks and never establish factual correctness, pronunciation or human listening. A failed check produces a report and a nonzero exit code, without rewriting the input media.

## Release 2: reviewed multi-scene rendering and design

### Review v2

Implement a separate versioned review envelope; do not reinterpret v1 records. Review initialization stores the full editorial snapshot and begins pending. A manually imported polish result may change only identified manuscript/title/cue text, produces a structural and factual-token diff, and never approves itself. Added or removed text IDs are included in the diff.

Changes to facts, source references, timing, visual data, input audio or renderer settings require a new snapshot and review revision. Human approval records reviewer, factual-review notes, resolution notes for flagged changes, snapshot hash, review-content hash, issue time and expiry. Production rendering verifies current input bytes and both hashes immediately before work and before final assembly. Partial output and cache hits never waive approval checks.

Long-form review does not impose the v1 three-point policy. It retains explicit manual approval, expiration, stale-input rejection and honest adapter provenance. Existing human-writing adapters are not advertised as v2-capable until the protocol explicitly supports the v2 payload; the manual route is sufficient for this release.

The fixed synthetic workflow has a source-pinned complete content definition. Its CLI accepts only an output location and a closed set of named fixture variants, never an arbitrary manifest or audio file. `fictional: true` alone does not grant an unreviewed rendering path.

### Visual system

Create shared tokens for typography, spacing, chart strokes, colors, source placement and subtitle safe areas. Use the pinned Noto Sans SC font. Labels and renderer chrome come from English and Chinese catalogs, with English as the default and explicit `contentLanguage` selection; manuscript text is user content and is not translated automatically.

Support six original templates: metric focus, bar comparison, signed cash waterfall, trend, process/timeline, and evidence excerpt. Template data defines every displayed value, label, unit and source. Reject unsupported shapes rather than silently falling back to an unrelated card layout. Comparison bars share a scale and zero baseline; signed waterfalls reconcile; trends disclose units and intervals. Do not infer financial meaning from a visual difference.

An event produces a deterministic state at any integer frame. All animation uses frame-based interpolation, with no browser wall-clock timers or CSS transition dependence. Keep one principal focus per stage. Highlights, connecting brackets and explanatory annotations appear at cue-linked events; sources and material qualifiers remain available. Captions show a background only when text is present.

Emit full-size representative frames plus 360- and 390-pixel-wide previews for visual inspection. Automatically check loaded fonts, text overflow, frame bounds and caption-safe-area collisions. These checks supplement visual inspection; they cannot prove mobile legibility by themselves.

### Rendering, stages and cache

Compile scenes into event stages: deterministic short animation spans followed by static holds until the next event. Render animation frames using Playwright and extend holds with FFmpeg. Subtitle overlays are derived from the same timeline. Preserve object IDs and geometry across adjacent stages to avoid repeated whole-screen entrances.

Use task/build-specific temporary directories and an explicit project cache. Keys include canonical stage data, relevant input file hashes, source/template revisions, dependency lock hash, browser/font/tool versions, output geometry, timing and encoder settings. Store completed media and a verification receipt through a temporary name followed by same-volume rename. Missing receipt, failed validation, interrupted write or mismatched hashes is a cache miss. Validate cached media before reuse.

Assemble validated stages in order, mix an explicitly selected licensed local audio input, add derived chapters and subtitles, and verify the final file. Background audio is optional and never synthesized or added silently. Audio normalization settings are explicit. Final output is create-only in a new build directory; a failed build is retained with diagnostics and never marked complete.

### Comparison sample and acceptance

Create a pinned 36-second synthetic sample covering a comparison, a signed waterfall, a process/timeline and a trend, with several cue-linked events within a scene. Also provide short fixture renders for metric and evidence templates. Compare legacy-style and improved comparison scenes using identical fictional values, cue timings, audio and output dimensions.

Provide silent/tone-based fixtures for deterministic offline CI. For the local voiced comparison, use the explicitly triggered SAPI adapter from release 3 with fixed synthetic text. Mark the voice as synthetic and not human-audited. Deliver full videos, representative/intermediate frames, phone-width previews, a contact sheet and measured render/cache timings. Inspect the improved video and frames before claiming visual improvements; do not promise a speedup without measurement.

## Release 3: local voice and historical adoption

### Audio adapters

User-provided local audio plus SRT is the default path. Import copies original bytes to stable project inputs and preserves provenance. Never silently retime existing captions after audio changes.

Provide an optional Windows SAPI command with explicit voice selection and execution flag. It is never invoked by doctor, manifest loading or ordinary rendering. Generate short clips into a new directory, measure durations and propose a frame timeline; human text and pronunciation review remains pending. No cloud voice service, credential lookup or transcription-model installation is added.

### Historical projects

Add explicit local adapters for the existing fixed sample, full timeline and external-audio scene layouts. Adapters validate their known input structures and report unsupported scene types; they do not guess mappings or replace missing facts. Reuse the six supported templates where semantics match, recording visual differences in an adaptation report.

For each known local project, write a new adapted project directory, copies of selected original inputs, input-hash comparisons and a pending v2 review. Preserve all old outputs, directory links and authorization records. Import the existing external audio to stable new inputs without editing the historical file or its old bindings. Private manuscript, media and research never enter this repository.

Historical video regeneration is a final separately gated action: present the exact compiled project and factual/textual/visual differences for current hash-bound human approval. The broad development request does not fabricate approval for a transformed manuscript or imply permission to publish it.

## Validation and completion

- Release 1: strict-schema and malformed-path cases; link escapes and cross-drive behavior; changed/missing input bytes; BOM/multiline SRT; rounding collisions; chapter order; actual synthetic-media probe/decode and negative expectation cases.
- Release 2: pending/rejected/expired/changed-input refusal before creating build output; added/deleted claim diffs; pinned-demo refusal of arbitrary content; deterministic intermediate frames; no-network rendering; six-template layout checks; interrupted/corrupt cache behavior and input invalidation; overwrite refusal; complete synthetic production with valid chapters and audio.
- Release 3: local voice unavailable/explicit-execution cases; file-copy integrity and collisions; all known historical adapters producing pending projects and honest unmapped-feature reports; voiced synthetic comparison inspected locally.
- Every release runs `npm run check`, `npm test`, existing smoke and fixed review example. Rendering/review releases add their new offline smoke checks to CI. Required checks must pass on the current combined branch before merge.
- Source/docs changes use reviewed PRs with the user's standing integration authorization. Verify merged main and remove only this task's completed branches/worktrees. No deployment or video publication is configured.

The work is complete when releases 1–3 are merged and documented, all synthetic acceptance artifacts are generated and inspected, known historical projects have validated pending adaptations, and remaining human approvals/listening items are explicitly listed. Do not describe a pending historical adaptation as a newly finished film.

## Documentation extension requested on 2026-10-21

Move `THIRD_PARTY.md` to `docs/third-party.md` and `VALIDATION.md` to `docs/validation.md`, updating all links. Preserve the existing validation record as dated evidence; do not relabel it as new validation. Keep `README.md`, `LICENSE`, `AGENTS.md`, npm package/lock files, TypeScript and ESLint configuration in their functional root locations. Explain their roles in a bilingual repository-structure page rather than copying configuration into documentation.

Add MkDocs with Material and static-i18n, English as default and Simplified Chinese as an explicit language choice. Use suffix-localized pages, keeping existing English document paths stable. Cover getting started, review, data layout, configuration, third-party notices and validation in both languages; add production commands as they ship, without documenting proposed commands as available.

Pin MkDocs 1.6.1, Material 9.7.7 and static-i18n 1.3.1, with a compiled transitive dependency lock for Python 3.12. Keep doc dependencies separate from Node dependencies. Build strictly into an explicitly supplied external directory. Use local theme assets and system fonts with no remote font, analytics or CDN requests. Verify locale selectors and links under a repository-subpath URL. CI builds documentation but does not deploy or publish a site without a separate request.
