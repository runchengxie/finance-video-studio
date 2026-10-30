# Project boundaries

Only original code, synthetic examples, documentation and explicitly licensed assets belong here. Never add private research, market feeds, credentials or third-party media. Generated outputs must use an explicit external output directory.

Run `npm run check` and `npm test`; after installing the pinned Chromium run `npm run smoke -- <external-directory>`. Tests and rendering must not access the network. Do not merge or publish videos automatically.

Also run `npm run review:example -- <empty-external-directory>` for review/render changes. Real manuscripts require hash-bound human approval; never add a generic unreviewed render bypass. Synthetic demos must remain pinned fixed fixtures. Do not copy third-party skill instructions into this public repository or claim that a protocol stub invoked a real skill. External adapters are explicit, local configuration with user-triggered execution only.

# Manuscript editorial requirements

For real video production, follow the [production workflow](docs/production-workflow.md). Formal MP4 delivery excludes internal review notes by default; retain audience-relevant sources, units, periods and material limitations. Keep review records separate and bind the delivery presentation to the approved snapshot.

When preparing, reviewing or revising video manuscripts for this project, read and apply [the editorial review brief](docs/editorial-review.md), including the [Chinese prompt](docs/editorial-review.zh.md) for Chinese content. Check the question's premises, evidence scope and useful academic/practitioner objections before polishing language. Retain dated sources and a separate change note with unresolved issues. Preserve originals. A writing-rule checker or model review never grants factual verification or rendering approval.
