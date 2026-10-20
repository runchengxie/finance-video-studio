# Repository structure

| Path | Responsibility |
| --- | --- |
| `src/`, `test/`, `examples/` | Original implementation, validation and synthetic examples |
| `docs/` | Public guides, third-party notices, dated validation and bilingual translations |
| [package.json](https://github.com/runchengxie/finance-video-studio/blob/main/package.json) | npm scripts and package dependency declarations |
| [package-lock.json](https://github.com/runchengxie/finance-video-studio/blob/main/package-lock.json) | Exact npm dependency graph used by `npm ci` |
| [tsconfig.json](https://github.com/runchengxie/finance-video-studio/blob/main/tsconfig.json) | TypeScript project and compiler settings |
| [eslint.config.js](https://github.com/runchengxie/finance-video-studio/blob/main/eslint.config.js) | ESLint flat configuration |
| `mkdocs.yml` | Documentation navigation, theme and language configuration |
| `docs/requirements.in`, `docs/requirements.txt` | Direct documentation dependencies and fully pinned hash-checked installation lock |
| `README.md`, `LICENSE`, `AGENTS.md` | Repository entry point, original-code license and development boundaries |

Tool configuration stays at the repository root so existing npm, compiler, lint and editor commands retain their normal discovery behavior. These files are documented here, rather than copied into `docs/` and allowed to drift. Documentation prose uses lowercase kebab-case filenames; translated pages use the `.zh.md` suffix.

The [third-party notices](third-party.md) distinguish the original-code license from dependencies. The [validation record](validation.md) preserves dated evidence. Internal design and execution plans are excluded from the public MkDocs navigation/build.

Keep generated media, site output, models, private research and credentials outside this checkout. See [data layout](data-layout.md). Configuration is not permission to load credentials or publish a video.
