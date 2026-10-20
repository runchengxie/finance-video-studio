# Finance Video Studio

Create deterministic local finance explainer videos with explicit manuscript review. The public repository contains original code and fictional examples; real research, drafts, audio and outputs stay in external project directories.

## Getting started

Use Node 24 or newer and FFmpeg/ffprobe with libx264 available on PATH. Install the pinned dependencies and Chromium before working offline:

```sh
npm ci --ignore-scripts
npx --no-install playwright install chromium
npm run check
npm test
npm run smoke -- /absolute/external/empty/smoke
```

The [fixed demo](https://github.com/runchengxie/finance-video-studio/blob/main/examples/demo.json) contains fictional data and is silent by default. `npm run demo -- /absolute/external/empty/demo` renders its 900 frames at 1280×720 and 30 fps. Outputs include MP4, subtitles, retained frames and a render manifest. An explicitly supplied licensed local audio path can be appended; there is no bundled narration service.

For real content, follow [manuscript review](manuscript-review.md). Importing a polished draft does not approve it. Rendering requires current explicit human approval bound to the exact project hash. The existing v1 review handles a title and three short captions; the proposed multi-scene workflow is not yet shipped.

Read [data layout](data-layout.md) for project materials and [repository structure](repository-structure.md) for configuration and documentation. Automated checks establish structural properties, not factual accuracy or human listening quality. See the dated [validation record](validation.md) for what was actually checked.

## Build this documentation

Use Python 3.12 in a separate environment. Install the pinned documentation dependencies, then supply an external site output directory:

```sh
python -m pip install --require-hashes -r docs/requirements.txt
python -m mkdocs build --strict --site-dir /absolute/external/docs-build
```

The language selector switches between English and Simplified Chinese. Documentation uses local theme assets and system fonts. CI builds the site; no documentation deployment is configured.
