# Broadcast template

Use `broadcast-v1` for a reusable news desk layout with local document images, charts and an independently moving background. The existing `studio-v1` remains available. Every real project still requires approval of its exact editorial snapshot.

## Try the fixed example

```sh
npm run studio -- broadcast-demo /absolute/new-example
node --import tsx test/production-broadcast-example.ts /absolute/another-new-example
```

The closed 12-second example uses fictional values and generated media. It accepts only a new external output directory. `build/final.mp4` and `warm-build/final.mp4` demonstrate identical cold/warm output. The test entry also checks cache hits and output hashes. No arbitrary manuscript or audio can enter this route.

## Configure a reviewed project

Retain the v2 manifest fields and set these render options. Inputs retain their own path, SHA-256, provenance and rights records.

```json
{
  "theme": "broadcast-v1",
  "broadcast": {"programName": "Research Desk", "backgroundVideoId": "backdrop"},
  "crf": 20,
  "audioId": "narration",
  "normalization": null
}
```

`backdrop` must identify a `video` input under `inputs/`. Use a silent 1920×1080, 30 fps constant-frame-rate loop with a finite duration. The renderer ignores its audio and continues its phase across scenes, subtitles and cached holds. Without a background input, the translucent foreground is composited onto black.

Each scene can add `presentation`.

```json
{
  "layout": "evidence",
  "chapterLabel": "Fee comparison",
  "headline": "Compare the same cost components",
  "sidebar": [{"label": "Check the original", "cueId": "cue-1"}],
  "evidencePanels": [{
    "inputId": "page-crop", "sourceId": "original-document",
    "label": "Document excerpt", "pageLabel": "PDF 2",
    "highlight": {"x": 0.1, "y": 0.4, "width": 0.8, "height": 0.1, "cueId": "cue-1"}
  }]
}
```

| Layout | Use |
| --- | --- |
| `evidence` | Local document panel, central comparison and optional sidebar |
| `wide-chart` | Full-width chart, including positive and negative values |
| `explanation` | Process cards, qualifications or a concise excerpt |

The sidebar allows up to three items. Evidence allows up to two images. Highlight rectangles use normalized coordinates relative to the actual image. Cue references must overlap the scene. Stable chapter IDs must be contiguous and unique across chapter runs; display labels may repeat. English is the default authoring convention, and `contentLanguage: "zh"` selects Chinese fixed labels. Project-authored titles and labels must be translated by the author.

Use `signed-comparison` with `data.unit` and `data.items` for negative values. Each item has `id`, `label` and `value`. Bars share a zero and linear scale; number labels retain their values during reveals. The original `comparison` still rejects negative values. Use two bars for two observed endpoints when no intermediate observations exist.

## Prepare evidence and render

Archive the original document separately as `evidence`. Export the relevant PDF page or crop as PNG/JPEG and import it as `image`. Retain the source URL, document date, observation period, retrieval date and page number in project records. The scene source must include the panel's source ID. A screenshot is a display copy of that source.

Images are local and hash-bound. The loader checks extension, signature, decode, 20 MiB maximum and 4096×4096 maximum dimensions. Rendering makes no network requests. Changes to media, configuration or renderer invalidate review and cache snapshots.

Follow the [production review and render commands](production-rendering.md). Preserve original audio when changing packaging. The output is H.264, yuv420p, BT.709 limited range; audio is AAC at 48 kHz when present. Cached stages and the assembled film are decoded and checked before delivery.

## Check the result

Inspect every scene and reveal midpoint at full resolution, then inspect a 390 px preview. `layout_check` reports the scene and overflowing text. Shorten on-screen labels while preserving qualifications, use the wider layout or split a dense scene. Do not hide overflowing source text. Retain complete citations in archived evidence.

Automated checks do not establish factual correctness, mobile readability, human listening or native-player compatibility. Record those review states separately. Rendering does not publish a video.
`presentation.chartStyle: "values"` displays comparison items as a numeric list, useful for fee components and totals. Numeric metric/comparison data can set `precision` (0–8 decimal places). A comparison `difference` can set its own `unit` and a `cueId` for delayed appearance, so a percentage-point difference is not labeled as a percentage rate. These options are part of the reviewed snapshot.
Backgrounds must be self-contained MP4/MOV (with an `ftyp` header) or WebM. Playlists and network protocols are rejected before probing. Dense chart labels or document images that exceed their assigned regions stop the render; shorten the label or prepare a smaller crop.
