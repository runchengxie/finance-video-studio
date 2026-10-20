# 财经视频制作工具

在本机制作可重现的财经解释视频，并在渲染前明确审阅文稿。公开代码只包含原创实现和虚构示例；真实研究、稿件、音频及输出保存在外部项目目录。

## 开始使用

需要 Node 24 或更新版本，以及 PATH 中支持 libx264 的 FFmpeg 和 ffprobe。先安装锁定依赖与 Chromium，再执行离线检查。

```sh
npm ci --ignore-scripts
npx --no-install playwright install chromium
npm run check
npm test
npm run smoke -- /absolute/external/empty/smoke
```

固定演示使用虚构数据，默认无声。执行 `npm run demo -- /absolute/external/empty/demo`，会以 1280×720、30 fps 导出 900 帧。输出包括 MP4、字幕、保留帧和渲染记录。命令末尾可以显式追加已获许可的本地音频路径；项目没有内置配音服务。

导入润色稿不会批准渲染，只有当前有效、绑定完整项目哈希的人类批准才能通过。[v1 文稿审阅](manuscript-review.md) 覆盖标题与三段短字幕，[v2 制作流程](production-rendering.md) 支持完整文稿和多场景项目。

[数据目录](data-layout.md) 说明素材与输出归属，[项目结构](repository-structure.md) 解释配置和文档的存放方式。自动检查验证结构，不能证明事实正确或已经人工听校。已完成的检查见带日期的 [验证记录](validation.md)。

[v2 制作工具](production-tools.md) 支持项目初始化、不可变素材导入、预检、时间轴导出和媒体校验。审核与渲染命令参见[制作指南](production-rendering.md)。

## 构建本文档

建议使用独立的 Python 3.12 环境，安装锁定的文档依赖，并显式指定源码目录之外的构建位置。

```sh
python -m pip install --require-hashes -r docs/requirements.txt
python -m mkdocs build --strict --site-dir /absolute/external/docs-build
```

语言菜单可以切换英文与简体中文。页面使用本地主题资源和系统字体。CI 只检查构建，尚未配置文档部署。

六类模板与多场景视频参见[审核后生成视频](production-rendering.md)。

