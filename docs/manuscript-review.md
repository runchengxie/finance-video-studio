# Manuscript review before narration and rendering

This change is stacked on PR #1. It adds a local review stage; it does not merge PR #1, supply a model, verify facts automatically, or publish a video.

The intended sequence is source/fact verification, a three-point draft, human-writing polishing, factual-difference review, human approval, then licensed local audio, subtitles and rendering. Enter substantive content in the first three seconds. Use natural spoken language, keep exactly three points, stop when the explanation is complete, and do not impose a summary or suspense ending. Never invent personal experience.

## Skill availability and honest execution

The development machine's installed `human-writing` SKILL.md and agent metadata were readable. Its `scripts/check_prose.py` is a Python text-rule checker, not a complete rewriting/model executor; it accepts a text/Markdown path (or `-` for stdin). It does not implement this project's JSON adapter protocol. No complete programmatic human-writing executor was configured or invoked for this change. CI uses a synthetic local protocol stub and explicitly reports `skillUse: "not_used"`.

The repository contains original adapter code and task-specific guidance, not a copy of the third-party skill or its reference files. Use your own installed skill through your agent/editor, or configure a trusted local executable yourself. No unknown-source installation, subscription, paid model, credentials or automatic third-party transmission is added.

## Default manual route

Prepare a project JSON with a title and exactly three timed captions. The first starts at frame zero. `fictional: false` is permitted for real material; this label is not evidence of verification. Keep manuscripts, review records, sources, audio and machine configuration outside Git, under the resolved project data/config roots or a private temporary directory.

This minimal version reviews the existing title plus three caption segments (up to 45 characters each). Long scripts need a future segmentation design; the adapter does not silently truncate them.

```sh
npm run review -- init /absolute/draft.json /absolute/01-pending.json
npm run review -- status /absolute/01-pending.json
# pending_execution
```

The saved envelope has a recomputed `status` and a `review` containing the original project, input hash, policy terms, polished project (initially null), execution provenance, skill-use report, change notes, factual differences and approval. Output files are create-only and never overwrite an existing review revision.

Use the locally installed human-writing skill in your agent/editor on the draft. Manually save a result JSON outside the repository, following this shape. `polished` must contain the complete project, changing only title/caption text. Put your actual skill use in `skillUse`; use `operator_reported` only if you actually used the skill, otherwise `not_used`.

```json
{
  "inputHash": "<copy the 64-character hash from 01-pending.json>",
  "decision": "accepted",
  "polished": "<replace this string with the full polished project object>",
  "changeNotes": "Explain what was changed and why, including any factual edits",
  "skillUse": "operator_reported"
}
```

The illustrated strings are placeholders, not runnable fixture data. For a refusal, use `decision: "rejected"`, `polished: null`, and explain missing sources or other problems in `changeNotes`. A rejected result never passes the gate.

```sh
npm run review -- import /absolute/01-pending.json /absolute/polish-result.json /absolute/02-imported.json
npm run review -- status /absolute/02-imported.json
```

Import yields `awaiting_approval`, `facts_changed`, or `rejected`. Import never approves. If no executor/result is available, the record remains `pending_execution` rather than silently passing.

## Difference review and explicit human approval

The detector compares tokens separately within the title and each caption. It checks numbers, common currency/measurement units, dates, bracketed reference IDs, Chinese quoted material, and conservative qualifier terms. Configurable `extraTerms` supplement the default qualifier list and are included in the input hash. Order/count changes are flagged. Polishing cannot modify chart values, labels, units, timing, frame rate or other non-text project fields; create a new review from the changed draft instead.

**Token detection is not semantic fact verification.** It can produce false positives, miss unfamiliar units/date formats/paraphrases, and cannot establish source quality, attribution, causality or whether a claim is true. Even unchanged tokens can express a different claim. Review source documents, numeric calculations, quote context, references, qualifiers and the whole polished text. Keep those sources private and record the substantive review in your approval notes. The tool never performs this research for you.

After human review, create a private approval-options JSON with nonempty `reviewer`, `factReviewNotes`, and an ISO UTC `expiresAt` in the future. If any tokens changed, also provide nonempty `differenceReviewNotes` describing their resolution. Every unresolved difference should remain unapproved; the program records the operator's attestation rather than deciding whether those notes are adequate.

```sh
npm run review -- approve /absolute/02-imported.json /absolute/approval-options.json /absolute/03-approved.json --confirm-review
npm run review -- status /absolute/03-approved.json
# approved only for the exact recorded version
npm run render -- /absolute/polished-project.json /absolute/03-approved.json /absolute/empty-video-output
```

Append licensed local audio after the output path if available. An optional final CSV path overrides chart data **before** approval is checked; it must match the approved project or rendering fails. Do not describe a silent render as a finished voiced production.

Approval binds the entire polished project hash and review-content hash, including the draft, policy, provenance, change notes and fact differences. Changing the project or audit content invalidates that approval; expiration also yields `stale_approval`. Reimport a current result and obtain a new explicit approval after changes/expiry. A manually edited cached `status` is ignored. These are local workflow records, not cryptographic identity signatures or an access-control system against an operator deliberately forging the files.

## Optional user-triggered local adapter

Default configuration is `{"mode":"manual"}`. For a configured executable, keep an absolute local config JSON outside the repository:

```json
{
  "mode": "local_command",
  "command": "/absolute/path/to/trusted/executable",
  "args": ["/absolute/path/to/your-adapter-script"],
  "skillPath": "/absolute/path/to/installed/human-writing/SKILL.md",
  "extraTerms": ["未经核实"],
  "timeoutMs": 30000
}
```

On Windows, use an absolute executable such as `node.exe` with a script in `args`. No shell is started. Arguments are an array; do not supply a shell command string. Configuration is never discovered or executed automatically. Use the same configured policy at `init`; the resulting record retains those terms. Updating configuration alone does not alter an existing review's policy. Start a new review for policy changes.

```sh
npm run review -- init /absolute/draft.json /absolute/01-pending.json /absolute/local-config.json
npm run review -- run /absolute/01-pending.json /absolute/local-config.json /absolute/02-imported.json --execute-local
```

Both explicit configuration and `--execute-local` are required. A manual-mode run creates a fresh pending review revision, even if its input was previously approved; it cannot carry forward approval as evidence of a new polish execution. The original revision is preserved. A missing executable/skill file, changed policy, timeout, invalid response or mismatched hash fails without replacing the original pending record or inventing approval.

The executable receives one JSON object on stdin: `protocolVersion: 1`, `inputHash`, `draft`, `skillPath` and a short original task brief. It must return exactly the result-object shape described above on stdout; diagnostics belong on stderr. The installed skill path is verified locally, but skill content is not bundled or transmitted by this application. `adapter_reported` means the executable reported using the skill; it is not independent proof that an AI followed it. Adapter acceptance still requires separate human approval.

An explicitly selected executable can have its own capabilities, including network access and inherited local environment. Review it yourself before triggering it; this application cannot promise that arbitrary user-configured programs stay offline. The default manual workflow starts no external process and sends nothing to a third party. CI does not load the real installed skill, invoke AI, or call any external service.

## Fixed offline example and demo isolation

```sh
npm run review:example -- /absolute/empty/review-example
```

This accepts only an output directory and generates fixed fictional fixtures: pending review, a deliberate 12-to-13 factual-token change, explicit **simulated test** approval, the polished project, and a real three-second MP4/SRT. It probes and decodes that MP4 offline. Records identify the approval as a synthetic test simulation, not actual editorial review or actual human-writing invocation. This script cannot accept a real manuscript input.

`npm run demo -- /absolute/empty/demo` renders only the original pinned 30-second synthetic example. Smoke tests use two named fixed fixture variants. The base demo has a source-code-pinned content hash; editing its JSON makes this unreviewed path refuse to run. There is no generic `--skip-review` flag. Real drafts and arbitrary projects must use the reviewed renderer, even when their JSON says `fictional: true`.

CI runs deterministic synthetic tests for pending/rejected/changed/stale/approved states, local adapter consent and protocol behavior, then the fixed offline review example and existing video smoke tests in an isolated network namespace. Nothing is voiced, sent to a messaging service, published, or merged by this workflow.
