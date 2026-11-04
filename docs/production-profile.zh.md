# 固定制作规范

[English](https://runchengxie.github.io/finance-video-studio/production-profile/)

新工程默认使用版本化的 **`portrait-explainer-v1`**，即原生1080×1440、60fps、暖纸色栏目版式和轻微背景运动。默认值保存在代码和项目制作Skill中，具体机器路径与私人参考片留在仓库外。

```sh
npm run studio -- init /absolute/new-episode
npm run studio -- init /absolute/explicit-legacy --profile legacy-landscape
```

旧清单保留其明确声明的设置。真实旧清单缺少规范时，doctor会给出提示，不能把旧设置当成当前偏好。采用规范的新稿如果比例、帧率、样式、逐目标揭示或音频处理记录不合要求，将不能通过制作就绪检查。render和deliver仍须经过精确快照的人工批准，也会执行规范检查。兼容提示不授予批准。

## 音频必须记录明确决定

`productionProfile`纳入清单及快照哈希。新工程先使用`audioEdit: {"decision":"pending"}`，制作前再明确裁剪或全长保留。

```json
{
  "id":"portrait-explainer-v1",
  "audioEdit":{
    "decision":"trim",
    "sourceAudioId":"original-voice",
    "outputAudioId":"trimmed-voice",
    "startSeconds":6.5,
    "endSeconds":36.5,
    "notes":"仅为虚构切点示例。保留原音，并检查实际语句边界。"
  }
}
```

示例秒数不能用于每一期。原音和派生音轨须是不同输入，render.audioId选择派生音轨；保留区间与新时间轴时长相差不得超过一帧，两份音频都要绑定哈希。也可以声明`{"decision":"retain_full","sourceAudioId":"original-voice","reason":"这份原音没有服务片头或无关片尾。"}`，此时必须选择该原音。保留说话者原声，不自动等于保留平台介绍和片尾音乐。

代码检查声明和时间，不检查声音语义。需要逐期判断语句从哪里开始、结束，保留原始与裁剪后的转写及修正记录。音频处理记录和doctor都不能冒充真人听校或批准。

## 动画要解释内容

采用规范的每个画面目标都需要有已对齐的cue-linked reveal，至少持续0.2秒。一般可用约0.6秒，曲线或较复杂的说明可更长。只有背景运动或短暂高亮不满足规范。竖版比较柱从共同零点生长，瀑布柱从前一个余额变化，趋势线逐步描绘。标签保留最终披露数，过渡形状只是解释动画，不是新增财务观测值。

检查起点、中间态、结束态和非顺序跳转。事件存在不证明口播语义对齐。旧工程从30fps转为60fps时，必须经过秒数换算全部分镜、字幕及事件，不能只改宽高和fps。

## 控制版本体积

同一期共用一套inputs和稳定的渲染缓存，每次仅新增清单修订和必要派生文件。同类型素材内容相同且原有文件实际哈希通过时，import会复用既有输入路径并记录复用凭证；不创建跨项目别名，也不删除旧资料。已有输入损坏或缺失时应报错，不用新的拷贝掩盖问题。

历史资料经过授权去重、共享硬链接后，每次编辑都应另存新文件。直接改权限并原位覆盖共享inode会影响全部别名。稿件、审核记录和独有交付物保持独立；清理前先看引用与保留记录。

## 预览时不用复制整片

```sh
npm run studio -- preview /absolute/project.json /absolute/new-preview /absolute/shared-review-assets
```

此命令生成内部竖版原生预览，由音频时间驱动浏览器实时绘制同一套可跳转模板，包括动画中间态，不保存成千上万个抽样HTML画面。音轨留在本期inputs目录，字体与浏览器渲染脚本按内容哈希保存在明确指定的共享资源缓存中。移动审阅资料时须同时保留这些引用。此模式明确不支持混音/响度处理后的音频、横屏或外部背景视频/原文截图面板。

界面默认英文，可切换中文，浏览器允许时保存选择；`?lang=zh`明确选择中文。`#cue=cue-id`可跳到对应字幕。声明了裁剪的工程还可播放原始片头和片尾。生成或打开本页都不会编码MP4，也不授予批准；它不替代已完成build对应的review-page及正式媒体验收。
