# Production project tools

The v2 tools initialize external projects, import local assets, inspect readiness, export timelines and verify media. Use the [reviewed rendering guide](production-rendering.md) for multi-scene builds and explicit v2 editorial approval; inspection tools do not grant permission to render a manuscript.

```sh
npm run studio -- init /absolute/new-project
npm run studio -- import /absolute/new-project/project.json /absolute/licensed-source.wav narration
```

Import returns a new manifest revision path. The previous manifest and source remain unchanged. The copied input has a SHA-256 and provenance receipt; confirm usage rights and select its ID in render settings in a new authored revision. Failed operations retain a started receipt and cannot become a successful import implicitly.

The strict contract is illustrated by the [complete synthetic manifest](https://github.com/runchengxie/finance-video-studio/blob/main/examples/production.json). It supports full manuscript blocks, sources, scenes, subtitle cues and cue-linked events, with explicit units and bounded values. Scenes cover the declared duration exactly; cue IDs, target IDs and chapter intervals are checked. Audio is optional and silent projects are identified explicitly.

```sh
npm run studio -- doctor /absolute/project-revision.json
npm run studio -- doctor /absolute/project-revision.json --workspace /absolute/workspace.toml
npm run studio -- timeline /absolute/project-revision.json /absolute/new-timeline-output
```

Doctor is read-only: it hashes actual inputs, validates the project, checks unresolved events and probes configured FFmpeg/ffprobe plus the pinned browser/font. It does not inspect or grant editorial approval. Optional root configuration comes only from the explicitly supplied workspace TOML or `CODE_ROOT`, `DATA_ROOT`, `CONFIG_ROOT`; none is required for explicit project paths.

Timeline export creates SRT, per-scene ASS, chapter metadata and a storyboard in a fresh directory. SRT imports floor cue starts and ceil cue ends to 30fps; any overlap created by rounding is rejected with affected IDs. ASS text neutralizes literal backslashes and braces with full-width glyphs, preventing override instructions; authored line breaks remain visible.

## Verify an existing video

```sh
npm run studio -- verify /absolute/video.mp4 /absolute/expectations.json /absolute/new-report.json
```

Expectations specify width, height, fps, counted frames, duration, video codec, pixel format and whether an audio stream is required. Optional audio codec/duration, chapter intervals and black/silence/loudness scans add checks. Duration tolerance defaults to 0.1 seconds. Allowed black/silent intervals must be declared explicitly; source media and existing reports are never overwritten.

```json
{
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "frames": 900,
  "durationSeconds": 30,
  "videoCodec": "h264",
  "pixelFormat": "yuv420p",
  "audio": {"required": true, "codec": "aac"}
}
```

Verification records tool versions, media SHA-256, expectations and individual results. It counts frames and fully decodes the media. A passing signal report does not establish factual accuracy, pronunciation or human listening.

CLI exit codes: 0 success; 2 invalid arguments/project/path or existing output; 3 unavailable/failed tools; 4 failed media expectations. JSON diagnostics go to stdout for doctor and stderr for command errors. Use `npm --silent run studio -- ...` when consuming stdout programmatically.

`npm run tools:smoke -- /absolute/new-smoke-dir` exercises real synthetic media, timeline exports, negative specifications, tool failure and report overwrite refusal offline. It synthesizes a test tone, not narration.

