# Local data layout

Resolve the configured data root and use its `finance-video-studio/` directory for project data. The application still requires an explicit external output path; it does not discover or create this layout automatically.

Rendering outputs and saved review records support a data root on a different Windows drive from the checkout. Repository descendants remain rejected, including directories whose names begin with two dots.

```text
finance-video-studio/
  README.md
  catalog.json
  experiments/<project-id>/
  runs/<topic>-<YYYYMMDD>/
  maintenance/<task-id>/
```

`README.md` is the local navigation entry. An optional `catalog.json` lists project-relative paths and existing artifacts; it is a local inventory, not an approval record or an application input schema. Keep absolute machine paths, private topics and manuscript content out of this public repository.

`experiments/` retains historical standalone engines and their reproducible inputs. `runs/` contains task-specific drafts, review records, assets and outputs. A run can contain an editable production project as well as rendered results. Preserve existing project IDs and internal layouts when moving historical work; do not assume every run uses the same renderer or schema.

Within a historical project, keep scripts, lockfiles and renderer-relative `src/`, `public/` and `output/` paths together. Identify authoritative facts, evidence and manuscripts separately from derived metrics, generated audio, intermediate segments and final deliverables in that project's README. An output directory may contain unique manuscripts, artwork and delivery records as well as rebuildable files; it is not disposable as a whole.

Before relocating existing data, inventory links, path-bearing manifests, running processes and downstream references. Record original file hashes, move without overwriting destinations, repair dependency links and media concat lists, and verify hashes and referenced files at the new location. Store migration records and any original-text backups under `maintenance/<task-id>/`. A compatibility directory link can preserve old bookmarks, but new commands and dependency links should use the canonical location.

Keep shared dependencies explicit in each consumer's reproduction notes. Before changing dependencies in a project with a linked `node_modules`, remove only that link and install independently from its own lockfile. Never recursively delete the shared target as part of dependency cleanup.

Historical experiments may contain local narration, scene caching, mixing or chapter support that the production renderer does not implement. Directory consolidation does not import those features, certify their factual content or satisfy the manuscript approval gate. Reusable features must be adapted with original code and synthetic fixtures, preserving the current hash-bound human approval requirement. Retain private research, third-party reference documents, media and generated artifacts outside this repository.

## Read-only retention inventory

Run `npm run studio -- storage-audit /absolute/project-data /absolute/new-report.json` to inventory retained files before cleanup. The report hashes same-size candidate files, groups exact duplicates by distinct device/inode, separates already-shared bytes from potential same-filesystem savings, lists symbolic links without following them, and excludes `.git`, `node_modules`, `.venv` and `venv` directory trees. Accounting uses file sizes, not allocated disk blocks; links outside the scanned tree and active consumers require separate inspection. The command never deletes, relocates, changes permissions or creates hardlinks. The new report must not exist already.

A matching hash is not a retention decision. Preserve unique manuscripts, approvals, evidence, source audio and delivery records. When separately authorized immutable deduplication retains all paths through hardlinks, record original metadata, hashes and replaced paths, verify every result, and write future revisions to new files. Do not overwrite a shared inode or treat a duplicate report as an automatic cache purge. Prefer native time-driven previews over repeated sampled HTML/PNG frame sets; retain one stable scene cache per episode and produce complete MP4s only at the approved delivery stage.
