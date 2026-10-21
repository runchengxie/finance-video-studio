# 制作项目工具

v2 工具可以初始化外部项目、导入本地素材、检查准备状态、导出时间轴并核验媒体。多场景渲染和 v2 文稿批准参见[审核后生成视频](production-rendering.md)；检查工具不会批准任何稿件。

```sh
npm run studio -- init /absolute/new-project
npm run studio -- import /absolute/new-project/project.json /absolute/licensed-source.wav narration
```

导入命令返回新的清单版本路径，原清单和源文件保持不变。程序会为素材副本记录 SHA-256 和来源。操作者仍需确认使用权，并在新的编辑版本中选择需要使用的音轨 ID。导入失败时会保留操作开始的记录，但不会将这次操作记为成功。

清单结构见 [完整虚构示例](https://github.com/runchengxie/finance-video-studio/blob/main/examples/production.json)。它包括完整文稿块、来源、场景、字幕和由字幕触发的事件；数值有明确单位和范围。场景必须完整覆盖声明时长，字幕、图形目标和章节都通过标识关联。没有选择音轨时明确标为无声项目。

```sh
npm run studio -- doctor /absolute/project-revision.json
npm run studio -- doctor /absolute/project-revision.json --workspace /absolute/workspace.toml
npm run studio -- timeline /absolute/project-revision.json /absolute/new-timeline-output
```

预检只读实际输入并计算哈希，检查清单、尚未定位的动画事件、FFmpeg/ffprobe 及锁定浏览器和字体。它不会读取或授予文稿批准。根目录配置仅来自显式提供的 workspace TOML 或 `CODE_ROOT`、`DATA_ROOT`、`CONFIG_ROOT`；只使用绝对项目路径时不依赖这些配置。

时间轴导出在新目录中生成 SRT、逐镜 ASS、章节元数据和分镜表。将 SRT 的毫秒时间换算为 30 fps 的帧位置时，起点向下取整，终点向上取整；若因此产生重叠，会报告对应字幕 ID，不能悄悄移动配音时间。ASS 的字面反斜杠和花括号转为全角字符以阻止控制指令，原文换行仍然保留。

## 检查已有视频

```sh
npm run studio -- verify /absolute/video.mp4 /absolute/expectations.json /absolute/new-report.json
```

预期文件需明确宽高、帧率、帧数、时长、编码、像素格式和是否需要音轨。可额外指定音轨编码与时长、章节区间，以及黑屏、静音和响度扫描。默认时长容差为 0.1 秒，允许存在的黑屏或静音区间必须显式声明。程序不会改写原视频或覆盖旧报告。

```json
{
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "frames": 900,
  "durationSeconds": 30,
  "videoCodec": "h264",
  "pixelFormat": "yuv420p",
  "audio": {"required": true, "codec": "aac"}
}
```

报告记录工具版本、视频 SHA-256、预期值和逐项结果，实际统计帧数并完整解码。通过信号检查不代表事实正确、读音正确或已经人工听校。

退出码为 0 表示成功，2 表示参数、清单、路径或已存在的输出有问题，3 表示工具不可用或失败，4 表示媒体不满足预期。预检 JSON 输出到 stdout，命令错误输出到 stderr；其他程序读取命令输出时可用 `npm --silent run studio -- ...`。

`npm run tools:smoke -- /absolute/new-smoke-dir` 在离线环境中验证合成媒体、时间轴、不符合预期的媒体参数、工具缺失和拒绝覆盖已有报告。测试只生成合成测试音，不生成旁白。

