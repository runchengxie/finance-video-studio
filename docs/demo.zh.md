# 示例与开发指南

先用固定示例确认本机可以生成视频，再准备自己的稿件。安装和运行入口见 [中文 README](https://github.com/runchengxie/finance-video-studio/blob/main/README.zh.md)。

## 环境与输出目录

需要 Node.js 24 或更新版本、npm，以及支持 libx264 的 FFmpeg 和 ffprobe。两种媒体工具都需要加入 PATH。首次安装依赖和 Chromium 需要联网，后续测试和渲染不访问网络。Linux 安装浏览器时可能需要执行 `npx --no-install playwright install --with-deps chromium`，以补齐系统依赖。

所有输出都使用源码目录之外的新建或空目录。Windows 可以放在 `$env:TEMP` 下，长期保存的资料按[数据目录约定](data-layout.md)整理。命令拒绝相对输出路径和代码仓库内的输出路径。

## 固定示例会生成什么

`npm run demo -- /absolute/new-demo` 使用源码中固定的虚构内容，导出 1280×720、30 fps、共 900 帧的视频，时长约 30 秒。内容包含三个中文解释要点，默认无声。

输出包含 H.264 编码、yuv420p 像素格式的 MP4、SRT 字幕、逐帧 PNG，以及记录关键帧哈希的清单。逐帧图片方便检查字体、图表和字幕是否完整显示。

命令末尾可以追加有使用权的本地音频路径。音频会转为 AAC，并补静音或截短至视频时长。固定示例不会自动调用配音服务，也不接受任意项目 JSON 或 CSV 来替换内容。

自己的稿件应使用[文稿审阅](manuscript-review.md)或[多场景制作流程](production-rendering.md)，先取得与当前完整版本一致的人工批准。

## 输入与渲染规则

v1 图表支持 `line` 和 `bar`，单位明确使用 `USD million` 或 `%`。输入必须符合项目 JSON 格式，数值有限且非负，文字长度受限。字幕按时间排列，区间采用 `[start,end)`，不得重叠。

显示数值保留一位小数，按 Intl 的 half-expand 规则取整。标题、标签和字幕会转义。渲染会检查字体是否加载、文字是否溢出，并阻止浏览器访问网络。v2 的六类模板、音轨和缓存规则见[制作指南](production-rendering.md)。

## 运行开发检查

```sh
npm run check
npm test
npm run smoke -- /absolute/new-smoke
npm run review:example -- /absolute/new-review-example
```

`check` 执行 TypeScript 和 ESLint 检查。单元测试覆盖合法与非法输入、数值和时间边界、路径、审核及媒体校验等行为。

`smoke` 实际生成三秒视频，逐帧检查字体和布局，在关键帧检查图表像素，再用 ffprobe 核对编码、尺寸、帧率、帧数和时长，并用 FFmpeg 完整解码。另有短折线图和本地合成测试音的验证。自动检查通过后，仍需人工查看图片并听校真实音频。

`review:example` 使用固定虚构数据演示审阅状态变化并验证渲染，不处理真实稿件，也不代表人类批准或实际使用了 human-writing 技能。

## 常见问题

- 提示找不到 FFmpeg 或 ffprobe 时，先确认两条命令都能在当前终端运行。
- 提示缺少 Chromium 时，重新执行 README 中的浏览器安装命令。
- 输出目录已存在且非空时，换一个新目录，保留之前的结果。
- 文字溢出时，缩短文案或拆分场景，再按需要重新审核。
- 稿件仍在待审状态时，按审核指南完成当前版本的人工审阅，不能靠修改状态字段跳过。

## CI 与文档发布

CI 安装依赖后，会在无网络环境中执行代码检查和渲染验证。main 的全部验证通过后，才发布同次构建的 MkDocs 文档。PR 只执行验证；需要重新发布文档时，可在 main 手动运行 validate 工作流。

只有部署文档的作业拥有 Pages 和 OIDC 写权限。CI 不上传或发布视频。浏览器、字体和 npm 依赖已锁定，Ubuntu 系统库和 FFmpeg 则未逐字节锁定，因此不同操作系统生成的视频文件可能不同。带日期的实际检查结果见[验证记录](validation.md)。
