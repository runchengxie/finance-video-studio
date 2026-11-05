# Rich Visuals Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add reusable conceptual artwork and seekable process diagrams, and inventory retained assets without deleting evidence.

**Architecture:** Extend native portrait presentation with hash-bound illustrations and optional process links. Use the existing scene renderer for both preview and export; keep original financial claims, audio and approval gates. Add a read-only storage inventory with byte hashes and inode-aware savings.

**Tech Stack:** TypeScript, Zod, Playwright, existing native renderer.

**Spec:** User approved warm-paper editorial illustration plus animated diagrams on 2026-11-05. Artwork supplies context; labels, numbers and paths remain deterministic. Keep episode assets shared across revisions and preserve originals.

## Global Constraints
- Native 1080×1440 at 60 fps; no new engine.
- No approval fabrication or automatic video publication.
- Private material and generated outputs stay outside source control.
- Inventory never follows symlinks or deletes files; savings exclude already-shared inodes.

## Review Focus
- Missing/wrong-type image and unsafe image URL fail explicitly.
- Diagram edges must refer to scene targets, including reverse links.
- Seeking at the same frame produces the same drawing.
- Referenced artwork changes invalidate only dependent scene caches.
- Existing hardlinks and symlinks must not inflate reclaimable bytes.

### Task 1: Artwork and process diagrams
**Files:** manifest.ts, portrait.ts, templates.ts, visual-fingerprint.ts, live-preview.ts, preview-client.ts; new process-diagram.ts and production-rich-visuals.test.ts.
**Interfaces:** presentation.illustration {inputId,label}; process data.links [{fromId,toId,label}], presentation.processStyle chain or cycle. loadVisualAssets remains the verified image loader.
- [ ] Write tests for validation, visible artwork, seekable link tracing and cache dependencies; run and observe failure.
- [ ] Implement native artwork and process diagrams; keep legacy scenes compatible.
- [ ] Make preview share verified images using hashed resource cache; test offline and tampering.
- [ ] Run full tests and checks.

### Task 2: Retained storage inventory
**Files:** new retention.ts and production-retention.test.ts; studio-cli.ts; bilingual data-layout docs.
**Interfaces:** inventoryStorage(root) returns grouped exact duplicates, already-shared bytes and potential independent-file savings; CLI storage-audit ROOT NEW_REPORT.
- [ ] Write and run failing tests for duplicate hashes, hardlinks and symlink exclusion.
- [ ] Implement read-only streaming inventory and CLI.
- [ ] Run checks; inventory historical project and retain actionable report externally.

### Task 3: Episode visual revision and delivery verification
**Files:** external episode inputs, new manifest, live preview and visual verification report; bilingual production docs.
- [ ] Generate warm-paper conceptual artwork and reuse only selected assets.
- [ ] Revise appropriate process scenes and chart presentation without changing claims or audio.
- [ ] Verify source hashes, all scene boundaries, intermediate reveal/link states and reverse seeking.
- [ ] Run check, test, smoke and review:example; review diff, submit PR, merge when current checks pass and verify deployment. Clean only task branches/worktree after merge.
