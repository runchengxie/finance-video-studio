# Finance Video Studio

Deterministic TypeScript finance explainer videos with a local manuscript-review gate and synthetic examples. MIT applies to original code only.

Start with the [manuscript review workflow](docs/manuscript-review.md) for real drafts. Human-writing is an optional locally installed skill, not a bundled AI service. Default state is pending manual work; importing polish never approves it. Rendering arbitrary projects requires explicit current human approval bound to the manuscript/project hash.

Read the [English documentation](https://runchengxie.github.io/finance-video-studio/) or [简体中文文档](https://runchengxie.github.io/finance-video-studio/zh/). The MkDocs site has a language selector; build instructions are in the documentation home. Configuration files remain at the repository root; see [repository structure](docs/repository-structure.md).

Apply the [editorial review brief](docs/editorial-review.md) when writing or revising manuscripts. It checks the question's premises and evidence scope before prose revision, with dated sources and useful specialist objections. The [Chinese prompt](docs/editorial-review.zh.md) records the Chinese writing requirements. This remains an operator/agent task rather than an automatic model approval.

## Run

Requires Node 24, npm, and FFmpeg/ffprobe with libx264 on PATH. Install dependencies with `npm ci --ignore-scripts`, then `npx --no-install playwright install chromium` (Linux may need `--with-deps`). Installation needs internet; tests and rendering do not. The lockfile pins dependencies, browser revision and the OFL Chinese font package.

```sh
npm run check
npm test
npm run smoke -- /absolute/external/empty/smoke
npm run demo -- /absolute/external/empty/demo
npm run review:example -- /absolute/external/empty/review-example
```

Windows example output path: `$env:TEMP/finance-demo-unique`. Output paths must be absolute, empty and outside this checkout. For permanent output, resolve your machine's configured data root and use its `finance-video-studio` directory. No machine-specific path is embedded in the code.

See [local data layout](docs/data-layout.md) for organizing historical experiments, task runs and migration records without mixing private materials into this repository.

The fixed demo is 900 integer frames at 30 fps, 1280×720, approximately 30 seconds. It contains **fictional data and three Chinese explanatory points**. Default output is **silent, not a finished narrated video**. Outputs include H.264/yuv420p MP4, SRT, individual PNG frames and a manifest with keyframe hashes. To add your own licensed local audio, append its path after the output directory. Audio is encoded as AAC, padded or trimmed to the video duration. No TTS or remote media service is used. Arbitrary JSON/CSV content uses the reviewed render command documented above. The fixed demo does not accept arbitrary project files or CSV overrides.

Set `chart` to `line` or `bar`; units are explicitly `USD million` or `%`. Input is strict JSON with finite nonnegative values, bounded label lengths and ordered, nonoverlapping caption intervals `[start,end)`. One displayed decimal uses Intl decimal half-expand rounding. Titles, labels and subtitles are escaped. Rendering rejects detected text overflow and missing loaded font faces. It blocks all browser network requests.

## Validation and limits

`npm run check` runs TypeScript and ESLint. Unit tests cover positive/negative schemas, CSV parity and rejected values, rounding/units, exclusive caption boundaries and HTML escaping. Smoke renders a real three-second video, checks Chinese font loading and layout at every frame, checks chart-color pixels on three keyframes, probes codec/dimensions/pixel format/fps/frame count/duration, then fully decodes with FFmpeg error escalation. Inspect retained PNGs for typography and content; automated pixel checks are intentionally structural checks, not a claim of editorial quality.

CI provisions dependencies before executing checks inside a Linux network namespace without network access. After validation succeeds on main, CI publishes the built documentation to GitHub Pages; workflow_dispatch on main can redeploy it. Pull requests validate without publishing. The deployment job alone receives pages and OIDC write permissions. No secrets or video uploads are configured. Actions use fixed commit SHAs and timeouts; validation retains read-only permissions. The Ubuntu runner's FFmpeg/system libraries are not bit-for-bit pinned, so encoded byte identity across operating systems is not guaranteed. Browser, font and npm dependencies are locked. Rendering is currently sequential and prioritizes reproducibility over speed.

Only synthetic examples and original code belong in this public repository. See [third-party licenses](docs/third-party.md). Never add private scripts, research, vendor prices, credentials or unlicensed audio/video. MIT does not relicense dependencies or externally supplied media.

The [v2 production renderer](docs/production-rendering.md) adds six templates, full editorial snapshots, cue-linked events, verified segment caches and fixed 36-second comparison examples. Run `npm run production:example -- /absolute/new-output improved` for the tone-based example.
