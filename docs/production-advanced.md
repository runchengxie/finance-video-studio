# Portrait production, evidence and review

Native v2 now accepts two explicit profiles: **1920×1080 at 30 fps** and **1080×1440 at 60 fps**. Set `width`, `height` and `fps` together; all scene, cue and event times are integer frames in that profile. Existing projects keep their declared profile. The [original portrait fixture](https://github.com/runchengxie/finance-video-studio/blob/main/examples/portrait.json) uses fictional data and no narration. Copy it to an external project directory before using project commands; it still follows the ordinary exact-snapshot approval flow.

Portrait uses its own layout, not a cropped landscape frame. Metric, comparison, signed comparison, trend, waterfall, process and evidence scenes retain their data and source labels. It also renders chapter/headline text, value-list mode, sidebar limitations and active emphasis. Dense layouts fail checks rather than silently dropping text. External background-video and evidence-image panels currently require the landscape profile; portrait manifests requesting these fail explicitly. Legacy HTML-based episodes remain unchanged and need explicit mapping into native scenes; the format option does not automatically convert old code or manuscripts.

## Shared visual settings

Add `render.visual` before approval:

```json
{"preset":"warm-paper","motion":"subtle"}
```

`preset` is `warm-paper` or `navy`, and applies to the video and generated covers. `motion` is `static` or `subtle`; subtle texture movement uses global frame time, so seeking and segment boundaries keep the same phase. It needs actual frames throughout holds and therefore costs more than static output. Default portrait colors are warm paper; existing landscape visuals remain compatible when this optional configuration is absent. Approval includes the visual configuration and renderer revision.

## Reuse unaffected scenes and resume

Keep a stable external cache for an episode, but use a fresh build directory each time. The full snapshot still authorizes the complete build. Cache fingerprints separately include the scene, relevant captions, all event-referenced cues (including offset cues outside that scene), sources, image/background hashes, output profile, visual settings, tools and renderer revision. A local subtitle change invalidates its affected scene; unrelated scenes can reuse verified segments. Global visible title, timing, style or renderer changes can invalidate more. Audio changes are assembled and verified again without needlessly discarding unchanged visual segments.

Every reused segment must match its recorded expectations and bytes and pass decode checks. A normally failed build leaves completed segments reusable. Render locks recover a confirmed dead owner only on the same host; an exclusive guard serializes recovery. Live, foreign, legacy or malformed locks are not removed. An abandoned guard requires manual inspection rather than unsafe automatic deletion. Do not delete locks for a running job.

## Link numeric claims to their visual and evidence

Use optional `numericClaims` in the approved manifest:

```json
{
  "id":"revenue-q3", "cueId":"cue-revenue", "sceneId":"comparison",
  "targetId":"revenue", "value":40, "unit":"USD million", "period":"Q3",
  "scope":"Fictional consolidated business", "sourceIds":["source-q3"],
  "status":"actual"
}
```

Status is `actual`, `guidance` or `estimate`; optional `calculation` records a formula or derivation. The claim must reference an overlapping cue, a real scene target and sources linked to that scene. `studio audit` reports missing claims, visual value/unit mismatches, and trend-period mismatches or unresolved period labels. Values and units must use the displayed visual's scale; record conversion in `calculation`. These are consistency checks, not verification of a source's truth, causal inference, or proof that every spoken number was covered. Date-only cues can be reviewed and left without a chart with a documented reason. Process/evidence targets still need editorial assessment of the numeric wording.

## Review with time links

```sh
npm run studio -- review-page /absolute/project.json /absolute/completed-build /absolute/new-review
```

This exports an **internal** local page with the matching native video, original configured audio, cues, numeric issues, claim details, original source links and internal notes. Click a cue or use `index.html#cue=CUE_ID` to seek. Its language switch offers English and Chinese. Local playback needs no network; opening an external primary-source link is a separate action. Current snapshot, native build and media hashes are checked before export, and copied local evidence is rehashed. This page neither renders a manuscript nor grants approval, and does not change the formal MP4. Keep the review directory private.

## Compare narration revisions

```sh
npm run studio -- compare /absolute/before.json /absolute/after.json /absolute/new-comparison
```

See [narration comparison](narration-comparison.md). It aligns existing transcripts, identifies numeric/date/unit changes and affected scenes, and preserves both manifest snapshots. It does not transcribe or listen to WAV files; audio identity is compared from declared manifest hashes and explicitly marked unverified. New speech needs a new transcript and listening review before using this report as a revision plan.
