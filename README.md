# Finance Video Studio

[中文介绍](README.zh.md) · [English docs](https://runchengxie.github.io/finance-video-studio/) · [中文文档](https://runchengxie.github.io/finance-video-studio/zh/)

Turn a finance script, charts and local audio into a video on your computer. Start with the included fictional example before preparing your own material.

The tool creates charts and scenes, adds subtitles and audio, and exports an MP4. Your own scripts need explicit human review before rendering. The software records the review; you still need to check facts and listen to the audio yourself.

## Try the first example

Install Node.js 24 or newer and FFmpeg with ffprobe and libx264 support. Both FFmpeg tools must be available in your terminal. Run these commands from the project folder:

```sh
npm ci --ignore-scripts
npx --no-install playwright install chromium
```

Installation needs internet access. Video rendering runs locally.

On Windows PowerShell, run:

```powershell
npm run demo -- "$env:TEMP/finance-first-demo"
```

On macOS or Linux, use `npm run demo -- /tmp/finance-first-demo`. The output folder must be new or empty and outside this repository. Choose another folder name to keep an earlier run.

The example produces a 30-second **silent video with fictional data**, subtitles and frame images. It does not generate narration. See the [demo guide](docs/demo.md) for output files, optional audio and troubleshooting.

## Use your own material

Follow the [production guide](docs/production-rendering.md) to prepare a project and review its script before rendering. Keep real research, scripts, audio and generated files outside the code repository. The tool does not upload or publish videos.

## Where to go next

| I want to… | Read |
| --- | --- |
| Understand the workflow | [Documentation home](https://runchengxie.github.io/finance-video-studio/) |
| Review a script | [Manuscript review](docs/manuscript-review.md) |
| Import media and check a project | [Production tools](docs/production-tools.md) |
| Create a video with several scenes | [Production rendering](docs/production-rendering.md) |
| Try optional Windows voice synthesis | [Local voice](docs/local-voice.md) |
| Organize project files | [Data layout](docs/data-layout.md) |
| Develop or verify the code | [Demo and development guide](docs/demo.md) |

The documentation supports English and Simplified Chinese, follows your system appearance, and offers a light/dark theme switch.

MIT covers the original code. Dependencies and external media keep their own licenses; see [third-party notices](docs/third-party.md).
