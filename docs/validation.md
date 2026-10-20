# First-version validation

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
