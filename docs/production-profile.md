# Persistent production profile

[简体中文](https://runchengxie.github.io/finance-video-studio/zh/production-profile/)

New projects use **`portrait-explainer-v1`**: native 1080×1440 at 60 fps, warm-paper broadcast styling and subtle background motion. These defaults live in version-controlled code and the production skill. Source paths and private reference episodes remain outside this repository.

```sh
npm run studio -- init /absolute/new-episode
npm run studio -- init /absolute/explicit-legacy --profile legacy-landscape
```

Existing manifests retain their declared settings. `doctor` warns when a real legacy manifest has no profile. Do not interpret that warning as confirmation that its settings match the current production preference. Profiled projects with format/style drift, missing cue-linked reveals or a pending audio decision fail readiness. Render and delivery retain exact-snapshot human approval and also enforce profile readiness. A legacy compatibility warning grants no approval.

## Record the audio decision

`productionProfile` is part of the manifest and the hash-bound snapshot. Start with `audioEdit: {"decision":"pending"}`. Before production, select one explicit decision:

```json
{
  "id":"portrait-explainer-v1",
  "audioEdit":{
    "decision":"trim",
    "sourceAudioId":"original-voice",
    "outputAudioId":"trimmed-voice",
    "startSeconds":6.5,
    "endSeconds":36.5,
    "notes":"Illustrative cut points only. Keep the source; check actual speech boundaries."
  }
}
```

Those seconds are fictional examples, not universal cut points. Reference two distinct audio inputs, select the derived input in `render.audioId`, and make the source interval agree with the project duration within one frame. Both source and derived bytes are hashed. Alternatively use `{"decision":"retain_full","sourceAudioId":"original-voice","reason":"This source contains no service introduction or unrelated outro."}`. This must select that same source. Never infer a cut or full-track decision from a prior episode's authorization to retain spoken audio.

These checks validate declarations and timing, not the meaning of the waveform. Confirm where speech begins/ends, preserve original/trimmed transcripts and correction records, and review the selected audio. Neither an edit record nor doctor establishes human listening or approval.

## Explain through motion

Every target in a profiled scene needs a resolved cue-linked `reveal` lasting at least 0.2 seconds. A typical reveal is about 0.6 seconds, with longer tracing where the narration needs it. Highlights or moving background texture alone do not meet this contract. Portrait comparison bars grow from their shared zero, waterfall bars grow from the preceding balance, and trend lines trace their paths. Labels retain the final disclosed quantities; intermediate geometry is explanatory animation, not new financial observations.

Inspect start, intermediate and settled states plus nonsequential seeking. A declared cue link cannot prove semantic synchronization. For 30fps legacy projects, convert all scene/cue/event frame values through seconds when adopting 60fps; do not reinterpret the old frame numbers.

## Keep revisions small

Keep one episode directory containing `inputs/`, manifest revisions and a stable render cache. Importing identical same-type bytes reuses a verified existing input path and records that reuse in its receipt. It does not create a cross-project alias, delete old material or reuse a declared hash without checking actual bytes. A changed or missing existing input fails rather than silently repairing the prior record.

For historical immutable files that already share hardlinks after an authorized deduplication, create a new file for every edit. Changing permissions and overwriting a shared inode would change all aliases. Keep manuscripts, reviews and unique deliverables independent; inspect references and retention records before cleanup.

## Inspect without copying a movie

```sh
npm run studio -- preview /absolute/project.json /absolute/new-preview /absolute/shared-review-assets
```

This exports an internal native portrait preview driven by audio time. It draws the same seekable templates in the browser, including intermediate animation, instead of storing thousands of sampled HTML frames. Narration and source audio stay in the episode inputs directory; font and browser renderer resources are hash-addressed and reused in the explicitly selected asset cache. Keep those paths together when moving a review. Mixed/normalized audio, landscape and external-video/evidence-image panels are explicitly unsupported in this inspection mode.

The UI defaults to English, offers Chinese, and remembers the selection when browser storage permits; `?lang=zh` selects Chinese explicitly. Cue fragments such as `#cue=cue-id` seek to a subtitle. A profiled trim includes controls to hear the original introduction and ending. Creating or opening this page neither renders an MP4 nor grants approval; it does not replace the completed-build `review-page` or final media verification.
