# Validation records

[简体中文](https://runchengxie.github.io/finance-video-studio/zh/validation/)

## Dependency compatibility (2026-11-05)

Direct npm dependencies and the documentation lock are updated to current compatible stable releases. TypeScript remains on 6.0.3 because typescript-eslint 8.72.1 declares `>=4.8.4 <6.1.0`; TypeScript 7 is outside that supported range. Node type definitions stay on the latest 24.x release to match the Node 24 runtime. Playwright 1.64.1 and csv-parse 7.0.3 are already current.

The registry audit still reports a moderate minimatch advisory ([GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)) in the ESLint development dependency tree. The current upstream ranges select minimatch 10.2.6; the advisory requires 11.0.1. No unsupported major override is applied. This does not affect the production dependency audit.

Validation passed with Node 24.22.2 and system FFmpeg 8.1.2: `npm run check`, all 101 tests, both pinned-Chromium smoke cases, the fixed synthetic review example, and the strict bilingual documentation build. The production dependency audit reported zero vulnerabilities. Generated evidence remains outside Git.

## Visual patch editing (2026-11-11)

Local validation used Node 24.22.2, the pinned Playwright Chromium, Noto Sans SC and system FFmpeg 8.1.2. `npm run check` passed; all 113 tests passed, including new preview drag/export, painted-frame determinism, visual cache-fingerprint and stale-patch cases. `npm run tools:smoke -- <external-directory>` passed with the new `studio patch` success and stale-hash rejection cases. The fixed synthetic review example and the pinned-Chromium smoke render also passed. The MkDocs build was not run on this host. Generated evidence remains outside Git.

## Key-frame look, storyboard and custom scenes (2026-11-11)

On the same host, `npm run check` passed and all 120 tests passed, including new key-frame determinism, layout-failure reporting, storyboard evidence cards, custom scene contracts and numeric-claim cases. `npm run tools:smoke -- <external-directory>` passed with `studio look` and `studio patch`; the fixed synthetic review example and the pinned-Chromium smoke render also passed. The MkDocs build was not run on this host.

`npm run benchmark:render` compared full repaint with a reused portrait trend DOM over 60 synthetic frames. Two local runs measured about 419–483 ms for full repaint and about 100–107 ms for attribute updates (roughly 3.9–4.9× faster), with identical screenshots at frames 0, 15, 30, 45 and 59. This is a single-host synthetic measurement, not a production renderer change or a general performance claim. Generated evidence remains outside Git.

## First-version validation

Local validation on 2026-10-17 used Node 24.19.0, the locked Playwright Chromium 156.0.8078.4 (revision 1248), Noto Sans SC 5.2.8, and external FFmpeg 9.0.2.

- TypeScript and ESLint passed.
- All five unit test groups passed, including rejected schema inputs and numeric/temporal boundaries.
- The 90-frame, three-second silent bar-chart smoke encoded, passed ffprobe checks and fully decoded without errors.
- The 60-frame line-chart test accepted a locally generated one-second 440 Hz tone, padded it to two seconds, produced AAC audio, and fully decoded. This is a test tone, not narration.
- The complete fictional-data example rendered 900 frames. ffprobe confirmed H.264, 1280×720, yuv420p, 30/1 fps, 900 decoded frames and exactly 30 seconds. FFmpeg full decode with `-xerror` completed successfully.
- The first and final full-demo PNGs were visually inspected. Chinese title/subtitles and numeric labels were legible and within the frame. Automated font/layout checks ran on every frame, with chart pixel checks on keyframes.
- After updating csv-parse to 7.0.3 and typescript-eslint to 8.71.2, npm audit reported zero known vulnerabilities. This is a point-in-time registry result, not a permanent guarantee.

Full-demo PNG SHA-256 samples (platform-specific evidence, not portable golden baselines):

| Frame | SHA-256 |
| --- | --- |
| 0 | c3ee994149d8e482f8df883b0223dd33f77153d321e0a5eaddff020eccc8a603 |
| 450 | 07abbf9c89b55a075063763782d4423bc9dbedc8f4439a5d1a554a1100fffa35 |
| 899 | 0a06213de0aae6d92b70b21a1a2aa6af6521b5c886fa2e16df65cbfe2e382c27 |

Generated videos/frames remain outside Git. The demo is intentionally silent and must not be described as a finished voiced explainer. See the PR checks for independent Linux CI results.
