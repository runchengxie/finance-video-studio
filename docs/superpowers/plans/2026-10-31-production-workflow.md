# Production workflow implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan inline.

**Goal:** Document the approved finance-video workflow and default clean MP4 presentation.

**Architecture:** Add bilingual operator guidance and navigation; retain existing rendering and approval contracts. Private media stays outside the repository.

**Tech Stack:** Markdown, MkDocs Material/i18n, existing TypeScript validation suite.

**Spec:** User requested repeatable guidance, selective framework adoption and formal MP4 without internal review notes; detailed requirements are captured in docs/production-workflow.md.

## Constraints and review focus

No dependency or rendering-engine changes. Do not imply that documented operator checks are CLI enforcement, that human listening is complete, or that hiding an internal note resolves factual uncertainty.

## Tasks

- [x] Add English and Chinese production guidance and navigation, with a persistent AGENTS link.
- [x] Run repository check, tests, smoke and strict bilingual documentation validation.
- [x] Review the whole diff. Integration and Pages deployment are tracked by PR #12 and its main-branch CI run.

## Decisions

Documentation-only changes need no artificial unit test duplicating prose. The existing required repository checks and strict documentation build validate integration. The real video uses a separately hash-bound local adapter, with an unchanged approval gate.

Validation: 66 tests passed, check passed, 90-frame silent and 60-frame audio smoke checks passed, review example passed, strict English/Chinese docs build passed. Independent review found no critical or important issues.

