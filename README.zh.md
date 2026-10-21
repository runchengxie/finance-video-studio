# 财经视频制作工具

[English](README.md) · [中文文档](https://runchengxie.github.io/finance-video-studio/zh/)

这个项目可以把财经稿件、图表和本地音频做成视频。你可以先跑自带的虚构示例，看看输出效果，再准备自己的内容。

它能绘制图表、编排场景、添加字幕和音轨，最后导出 MP4。自己的稿件需要先由人工审阅并明确批准，才能生成视频。程序负责记录审核状态，事实和读音仍需你核对。

## 先跑一个示例

准备 Node.js 24 或更新版本，以及带有 ffprobe、支持 libx264 的 FFmpeg。在终端中应能直接运行 `ffmpeg` 和 `ffprobe`。进入项目文件夹后，安装依赖和浏览器。

```sh
npm ci --ignore-scripts
npx --no-install playwright install chromium
```

安装时需要联网，生成视频在本机完成。在 Windows PowerShell 中运行下面的命令。

```powershell
npm run demo -- "$env:TEMP/finance-first-demo"
```

macOS 或 Linux 可以运行 `npm run demo -- /tmp/finance-first-demo`。输出文件夹必须新建或为空，并放在代码仓库之外。保留上一次结果时，下一次换一个文件夹名。

示例会生成约 30 秒的无声视频，使用虚构数据，同时保存字幕和逐帧图片。它不会自动生成旁白。输出文件、添加音频和常见问题见[示例与开发指南](docs/demo.zh.md)。

## 换成自己的内容

从[多场景视频指南](docs/production-rendering.zh.md)开始，准备项目资料，审阅稿件，再生成视频。真实研究、文稿、音频和输出文件都保存在代码仓库之外。工具不会上传或发布视频。

## 接下来可以看什么

| 想做的事 | 对应指南 |
| --- | --- |
| 了解整个流程 | [中文文档首页](https://runchengxie.github.io/finance-video-studio/zh/) |
| 审阅稿件 | [文稿审阅](docs/manuscript-review.zh.md) |
| 导入素材、检查项目 | [制作工具](docs/production-tools.zh.md) |
| 生成多场景视频 | [多场景视频指南](docs/production-rendering.zh.md) |
| 试用 Windows 本机配音 | [本机配音](docs/local-voice.zh.md) |
| 整理素材和输出 | [数据目录](docs/data-layout.zh.md) |
| 修改代码、运行检查 | [示例与开发指南](docs/demo.zh.md) |

文档站点可以切换中英文，默认跟随系统的明暗设置，右上角也能手动切换主题。

原创代码使用 MIT 许可。依赖和外部素材各有自己的许可，详见[第三方说明](docs/third-party.zh.md)。
