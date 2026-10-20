# 项目结构

| 路径 | 用途 |
| --- | --- |
| `src/`、`test/`、`examples/` | 原创实现、验证和合成示例 |
| `docs/` | 使用指南、第三方说明、历史验证和双语内容 |
| [package.json](https://github.com/runchengxie/finance-video-studio/blob/main/package.json) | npm 命令与依赖声明 |
| [package-lock.json](https://github.com/runchengxie/finance-video-studio/blob/main/package-lock.json) | `npm ci` 使用的精确依赖锁 |
| [tsconfig.json](https://github.com/runchengxie/finance-video-studio/blob/main/tsconfig.json) | TypeScript 编译与项目配置 |
| [eslint.config.js](https://github.com/runchengxie/finance-video-studio/blob/main/eslint.config.js) | ESLint 配置 |
| `mkdocs.yml` | 文档导航、主题与语言配置 |
| `docs/requirements.in`、`docs/requirements.txt` | 文档直接依赖及带哈希的完整依赖锁 |
| `README.md`、`LICENSE`、`AGENTS.md` | 项目入口、原创代码许可和开发边界 |

构建工具配置留在项目根目录，使 npm、编译器、编辑器和代码检查命令沿用正常的查找规则。这里说明它们的用途，不复制第二份配置。说明文档采用小写 kebab-case，中文翻译增加 `.zh.md` 后缀。

[第三方说明](third-party.md) 区分原创代码和依赖的许可，[验证记录](validation.md) 保留带日期的实际检查证据。内部设计与实施计划不进入公开 MkDocs 构建和导航。

生成媒体、站点构建、模型、私人研究和凭据都保存在源码目录之外，约定见 [数据目录](data-layout.md)。配置文件不会自动授予读取凭据或发布视频的权限。
