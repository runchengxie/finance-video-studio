# Finance Video Studio

Deterministic TypeScript finance explainer videos with a local manuscript-review gate and synthetic examples. MIT applies to original code only.

Start with the [manuscript review workflow](docs/manuscript-review.md) for real drafts. Human-writing is an optional locally installed skill, not a bundled AI service. Default state is pending manual work; importing polish never approves it. Rendering arbitrary projects requires explicit current human approval bound to the manuscript/project hash.

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

The fixed demo is 900 integer frames at 30 fps, 1280×720, approximately 30 seconds. It contains **fictional data and three Chinese explanatory points**. Default output is **silent, not a finished narrated video**. Outputs include H.264/yuv420p MP4, SRT, individual PNG frames and a manifest with keyframe hashes. To add your own licensed local audio, append its path after the output directory. Audio is encoded as AAC, padded or trimmed to the video duration. No TTS or remote media service is used. Arbitrary JSON/CSV content uses the reviewed render command documented above. The fixed demo does not accept arbitrary project files or CSV overrides.

Set `chart` to `line` or `bar`; units are explicitly `USD million` or `%`. Input is strict JSON with finite nonnegative values, bounded label lengths and ordered, nonoverlapping caption intervals `[start,end)`. One displayed decimal uses Intl decimal half-expand rounding. Titles, labels and subtitles are escaped. Rendering rejects detected text overflow and missing loaded font faces. It blocks all browser network requests.

## Validation and limits

`npm run check` runs TypeScript and ESLint. Unit tests cover positive/negative schemas, CSV parity and rejected values, rounding/units, exclusive caption boundaries and HTML escaping. Smoke renders a real three-second video, checks Chinese font loading and layout at every frame, checks chart-color pixels on three keyframes, probes codec/dimensions/pixel format/fps/frame count/duration, then fully decodes with FFmpeg error escalation. Inspect retained PNGs for typography and content; automated pixel checks are intentionally structural checks, not a claim of editorial quality.

CI provisions dependencies before executing checks inside a Linux network namespace without network access. No secrets, publishing, video uploads or deployment are configured. Actions use fixed commit SHAs, read-only permissions and a timeout. The Ubuntu runner's FFmpeg/system libraries are not bit-for-bit pinned, so encoded byte identity across operating systems is not guaranteed. Browser, font and npm dependencies are locked. Rendering is currently sequential and prioritizes reproducibility over speed.

Only synthetic examples and original code belong in this public repository. See [third-party licenses](THIRD_PARTY.md). Never add private scripts, research, vendor prices, credentials or unlicensed audio/video. MIT does not relicense dependencies or externally supplied media.
