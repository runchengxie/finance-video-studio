# Preflight and complete delivery

Run the read-only content audit before submitting the exact project revision for approval:

```sh
npm run studio -- audit /absolute/project.json /absolute/new-audit.json
```

The report proposes Chinese punctuation and selected financial-term corrections, flags long captions and numeric cues without a cue-linked event, and lists internal review labels found in audience fields. It never edits the manuscript or establishes factual verification or human listening. An event's presence does not prove that its value, visual or timing matches the narration. Reports are create-only. Other punctuation, terminology and factual errors still need editorial review.

Store operator notes in optional `internalNotes`. These are hash-bound review records and are not rendered. Real production rendering and delivery reject recognized internal status phrases in public fields rather than silently deleting them. This is a guard against known mistakes, not an exhaustive language classifier. Keep material caveats and estimate labels visible.

```json
{
  "internalNotes": [{"id": "listening", "text": "Full human listening has not been completed."}],
  "delivery": {
    "cover": {
      "headline": "What will drive future earnings?",
      "subtitle": "Content spending, margins and cash flow",
      "series": "FINANCIAL ANALYSIS",
      "imageId": "licensed-illustration",
      "imageLabel": "AI-generated conceptual illustration"
    }
  }
}
```

This is a manifest fragment, not a complete project. The optional image must reference a hashed image input and have an audience-facing label. Omit both image fields for a typographic cover. With no `delivery` settings, covers use the project title and localized default text. Settings belong in the approved manifest; changing them invalidates the old approval. Long or conflicting layouts fail instead of silently clipping text. Inspect the resulting covers at thumbnail size.

After an approved native render, make a complete package:

```sh
npm run studio -- deliver /absolute/project.json /absolute/approved-review.json /absolute/completed-build /absolute/new-delivery
```

`deliver` requires current exact-snapshot approval, a complete successful native `build.json` for that snapshot (including tools, matching stage IDs and successful verification), and a matching `final.mp4` hash. It independently probes and fully decodes the video against the manifest specification, then checks copied media, current inputs and approval again. Build records are trusted local artifacts, not signed attestations that prove the meaning of every encoded pixel; inspect the actual result. The command does not render or publish videos, repair a build, approve content, or accept a standalone MP4. Native v2 remains 1920×1080 at 30 fps; legacy custom portrait adapters are not automatically migrated.

The new directory contains:

```text
public/
  final.mp4
  subtitles.srt
  title.txt
  cover-3x4.png          # 1080×1440
  cover-4x3.png          # 1440×1080
internal/
  snapshot.json
  review.json
  verification.json
  audit.json
  timeline/
delivery.json
```

Only share `public/` as the audience package. Internal records retain corrections and limitations. `delivery.json` is written last, contains public artifact hashes and identifies completion. A failed attempt may leave a partial directory without this receipt; preserve it for inspection and retry in a fresh directory. Existing builds, inputs and output directories are never overwritten. `manualListening` remains false because the command cannot certify human listening; record actual human findings separately. Title text is taken from the approved project, not generated as a new editorial claim.

## Production skill

The original [finance-video-production skill](https://github.com/runchengxie/finance-video-studio/tree/main/skills/finance-video-production) coordinates these commands and the editorial workflow. Install that folder into the runtime's discoverable skills directory when requested. It contains no private media or machine paths. The skill selects and reviews; repository code performs deterministic operations. It does not add transcription tooling, automatic year correction, or a publishing permission.
