# Finance video production workflow

Use this checklist for real projects alongside the [rendering commands](production-rendering.md) and [editorial brief](editorial-review.md). It is an operator workflow, not a claim that every step is enforced by the CLI. Keep project media and records in the owning project's external data directory.

## Preserve inputs and establish the timeline

1. Retain the original audio, manuscript and source files with SHA-256 hashes. Record their provenance and permission to use them.
2. Record explicit audio trims, including any removed service introduction or outro music. Keep the narration as the timing authority; record any gain, speed or replacement separately.
3. Preserve raw transcription and corrected subtitles separately. Check Chinese punctuation, financial terms, dates, units and names. Keep a cue-level change record. ASR agreement does not establish what a person actually said.
4. Record whether a human has listened to the complete cut. Approval to retain an audio error and correct its subtitle does not mean the voice was repaired.

## Build an evidence ledger

For each financial claim, record its value, unit, period, entity, accounting scope, dated source and calculation. Distinguish actual results, guidance and estimates. A cash-payment estimate derived from content additions and liability changes must retain its formula and scope. Do not rank companies using incompatible profit measures or turn a plausible mechanism into established causation.

Resolve material factual gaps before approval or agree on a supported revision. Moving a workflow note out of the picture does not resolve its underlying factual issue. Keep corrections and unresolved questions in the project records.

## Map narration to visual evidence

| Narration | Preferred presentation | Required context |
| --- | --- | --- |
| One important number | Number card at its spoken cue | Label, unit and period |
| Two values or a change | Comparison bars or paired cards | Comparable scope and baseline |
| Several periods | Time series | Period labels, scale and missing data |
| Cash, accounting or business mechanism | Flow diagram | Distinguish timing from causation |
| Several monitoring questions | Branch diagram or mind map | Clear hierarchy and reading order |
| Business context | Illustration | Label a generated conceptual image appropriately |

Maintain a coverage list linking important spoken numbers to cues, visuals and sources. Do not invent observations to make a chart fuller. A year used only as a date may need a label rather than a separate chart. Keep subtitles readable when a number card is active.

## Animate from audio time

Use reusable chart and diagram components with a deterministic `drawAt(time)` or equivalent seekable interface. Forward playback, random seeks and reverse seeks must produce the same state at the same time. Reveal bars, lines, arrows and branches progressively with consistent easing. Keep final values readable; decorative number interpolation must not look like measured intermediate data. Background movement should remain subtle behind text.

## Separate review and delivery presentation

**A formal MP4 defaults to audience-facing content only.** Do not burn internal notes such as “pending listening”, “original voice retained”, “year corrected from sources”, “draft”, or operator approval status into the picture, captions, title cards or footer. Store these in the review interface, correction log and receipt. Apply the same rule to Chinese equivalents such as “待听校”“原声保留”“年份按资料更正”.

Retain audience-relevant source labels, units, periods, estimate labels and limitations needed to interpret a chart. A clean delivery view must not hide a material uncertainty or imply factual certification. Preserve the full review view separately. Include the exact delivery HTML, data, assets and any custom export adapter in the hash-bound approval snapshot. A presentation change after approval requires the applicable renewed approval; there is no unreviewed render path.

## Verify, export and retain a receipt

- Check every subtitle cue, scene transition and numeric event for clipping, overlap and source visibility at the actual export dimensions. Check that internal notes stay absent throughout the delivery timeline, including scene boundaries.
- Check animation start, intermediate and settled states, plus nonsequential seeking. Inspect representative rendered frames at viewing size.
- Render only the current approved snapshot into a new output directory. Recheck approval and hashes at completion. Keep intermediate and final artifacts distinguishable.
- Decode the whole MP4 and verify duration, frame count, dimensions, frame rate, codecs, audio presence and color metadata. For H.264, confirm BT.709 metadata in the encoded stream as well as the container where that delivery specification applies.
- Record final SHA-256, source snapshot, trims, export settings, check results and the actual human-listening status. Deliver the video with its subtitle and source/correction records as appropriate. Publishing is a separate explicit action.

The built-in production renderer and a project-specific adapter may support different delivery formats. A custom portrait export is not evidence that the built-in CLI supports that format. Bind and verify the adapter explicitly.

## Absorb framework ideas selectively

[Remotion](https://github.com/remotion-dev/remotion) is a reference for component-based video and frame-driven composition; inspect its [license terms](https://www.remotion.dev/docs/license) before adoption. [Motion Canvas](https://github.com/motion-canvas/motion-canvas) is a reference for code-driven explanatory animation. [faster-whisper](https://github.com/SYSTRAN/faster-whisper) can support transcription and word timing, with human correction retained.

Adopt the useful contracts first: reusable visual components, an audio-authoritative timeline, cue-to-shot mapping, deterministic animation and reproducible verification. These references are not installed dependencies or a claim that their code has been incorporated. Evaluate any new engine in an isolated synthetic example, record its pinned version, license and operating cost, then compare output quality and export reliability before migration. Do not replace the working pipeline merely to accumulate frameworks.
