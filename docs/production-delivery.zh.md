# 预检与完整交付

在提交具体版本供批准前，运行只读内容预检。

```sh
npm run studio -- audit /absolute/project.json /absolute/new-audit.json
```

报告对中文标点和部分财经错词提出候选修订，列出长字幕、没有关联事件的数字字幕，以及混入观众字段的内部提示。它不修改原稿，也不能证明事实正确或人工听校完成。有事件关联不等于数字、画面和时点已经匹配。报告只创建新文件；其他术语、标点和事实问题仍需编辑复核。

操作笔记可以放进可选的 `internalNotes`，纳入审核哈希但不渲染。真实项目渲染和交付会拒绝观众字段中已知的内部状态提示，不会悄悄删字继续。这只能防止已知问题，不能识别所有自然语言；重要口径限制和估算说明仍须保留。

```json
{
  "internalNotes": [{"id": "listening", "text": "待听校，原声按用户选择保留。"}],
  "delivery": {
    "cover": {
      "headline": "盈利增长还能持续多久？",
      "subtitle": "内容付款、利润率与现金流",
      "series": "财经观察",
      "imageId": "licensed-illustration",
      "imageLabel": "AI 生成概念插图"
    }
  }
}
```

这是清单片段，不是完整项目。可选封面图必须引用已计算哈希的图片输入，并带观众可见的说明。不需要图片时省略两个图片字段，生成文字封面。不配置 `delivery` 时使用项目标题和对应语言的默认文字。封面配置应在批准前确定；修改后旧批准失效。长文字或冲突布局会报错，不会直接裁掉文字。生成后仍应查看缩略图效果。

原生渲染完成后，生成完整交付包。

```sh
npm run studio -- deliver /absolute/project.json /absolute/approved-review.json /absolute/completed-build /absolute/new-delivery
```

命令要求当前精确快照的有效批准、对应快照的完整成功 `build.json`（含工具、匹配的分段编号及成功校验），以及哈希匹配的 `final.mp4`。它会按项目规格重新探测并完整解码视频，复制后再次检查文件、当前输入和批准。构建记录属于可信本地资料，不是能证明每个像素含义的签名凭证，仍须查看实际成片。命令不渲染、不修复构建、不批准内容、不发布，也不直接接受一个独立 MP4。原生 v2 视频仍为 1920×1080、30 fps；历史竖版自定义适配器不会自动迁移。

新目录包含以下内容。

```text
public/
  final.mp4
  subtitles.srt
  title.txt
  cover-3x4.png          # 1080×1440
  cover-4x3.png          # 1440×1080
internal/
  snapshot.json
  review.json
  verification.json
  audit.json
  timeline/
delivery.json
```

面向观众交付时只分享 `public/`。修订和限制留在内部记录。`delivery.json` 最后写入，包含公开文件的哈希，是完成标记。失败尝试可能留下没有完成凭证的部分目录，保留排查，换新目录重试，不覆盖原构建、输入或输出。命令无法证明人工听校，因此 `manualListening` 保持 false，实际人工意见另存。标题来自已批准的项目，不会在打包时生成新的编辑结论。

## 制作 skill

原创 [finance-video-production skill](https://github.com/runchengxie/finance-video-studio/tree/main/skills/finance-video-production) 串起命令和编辑流程，可按需安装到运行环境的 skill 目录。它不包含私人素材或机器路径。skill 负责选择步骤与复核，确定性操作由仓库代码完成；不会自动安装转写工具、猜改年份或取得发布权限。
