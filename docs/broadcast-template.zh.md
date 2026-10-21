# 栏目模板

`broadcast-v1` 提供可复用的新闻栏目布局，支持本地资料截图、图表和持续运动的背景。旧主题 `studio-v1` 继续可用。真实项目仍须审核具体版本，素材、清单与模板代码共同绑定审核快照。

## 运行虚构样例

```sh
npm run studio -- broadcast-demo /absolute/new-example
node --import tsx test/production-broadcast-example.ts /absolute/another-new-example
```

样例固定为１２秒，使用虚构数字和自动生成的素材。入口只接收新的外部输出目录。首次构建与缓存构建分别写入 `build/final.mp4` 和 `warm-build/final.mp4`。测试入口还核对缓存命中及视频哈希，不接受外部稿件或配音。

## 配置栏目

保留生产清单的其他字段，设置以下渲染参数。每份输入仍需记录路径、SHA-256、来源及使用权说明。

```json
{
  "theme": "broadcast-v1",
  "broadcast": {"programName": "研究观察", "backgroundVideoId": "backdrop"},
  "crf": 20,
  "audioId": "narration",
  "normalization": null
}
```

`backdrop` 指向 `inputs/` 下的 `video` 输入。背景采用１９２０×１０８０、每秒３０帧、固定帧率的有限时长循环文件。渲染器忽略背景文件中的声音，按全片帧号推进画面。分镜、字幕和缓存片段切换时保留背景位置。未提供背景时，半透明前景合成在黑底上。

每段分镜可增加 `presentation`。

```json
{
  "layout": "evidence",
  "chapterLabel": "费用比较",
  "headline": "比较相同的费用项目",
  "sidebar": [{"label": "核对原件", "cueId": "cue-1"}],
  "evidencePanels": [{
    "inputId": "page-crop", "sourceId": "original-document",
    "label": "资料摘录", "pageLabel": "PDF 第２页",
    "highlight": {"x": 0.1, "y": 0.4, "width": 0.8, "height": 0.1, "cueId": "cue-1"}
  }]
}
```

| 布局 | 用途 |
| --- | --- |
| `evidence` | 左侧原件、中间数字、可选侧栏 |
| `wide-chart` | 需要宽度的图表，含正负值比较 |
| `explanation` | 机制卡片、限定条件、简短摘录 |

侧栏最多３项，资料面板最多２张图片。高亮坐标以图片自身为准，取值从０到１，不得越界。关联字幕须与该分镜重叠。章节 ID 按连续章节设置，显示名称可以重复。`contentLanguage` 设为 `zh` 后，固定词条使用中文。栏目名和标题等项目内容由作者翻译。

有负值时使用 `signed-comparison`。数据包含 `unit` 和 `items`，每项包含 `id`、`label`、`value`。条形共用零点和线性比例尺，入场动画保留准确数字。原 `comparison` 继续拒绝负值。只有两个观测时点时，使用两根柱形，不补造中间走势。

## 准备资料并生成视频

原始文件按 `evidence` 归档，相关 PDF 页面或局部导出为 PNG、JPEG，再按 `image` 导入。项目记录保留来源网址、文件日期、统计期间、检索日期与页码。资料面板的来源 ID 须出现在该分镜的来源列表中。截图用于展示原件。

图片加载器核对扩展名、文件特征、实际解码和哈希。单张文件不得超过２０ MiB，尺寸不得超过４０９６×４０９６。渲染过程不联网，素材或模板变更会使旧审核和缓存失效。

按照[生产审核与渲染说明](production-rendering.md)生成视频。仅改包装时保留原配音。输出采用 H.264、yuv420p、BT.709 有限范围，有音轨时编码为４８ kHz AAC。缓存片段和最终视频都要通过解码与参数校验。

## 检查画面

检查每段完整画面及动画中间帧，再看３９０像素宽的预览。`layout_check` 会指出分镜与溢出文字。可缩短屏幕标签、改用宽布局，或拆分内容较多的分镜，同时保留必要限定。完整引用保存在资料档案中，屏幕来源不应靠裁切来缩短。

技术检查不能代替事实核验或人工听审。手机可读性、设备试播和发布状态分别记录。生成视频不会自动上传平台。
费用构成与合计可设置 `presentation.chartStyle` 为 `values`，按数值列表展示。数字指标和比较图可通过 `precision` 指定０至８位小数。比较图的 `difference` 可单独设置 `unit` 和 `cueId`，分别控制差值单位与出现时点。百分点差额因此可以保留自己的单位。以上配置均参与审核快照。
背景只接受自包含的 MP4、带 `ftyp` 文件头的 MOV 或 WebM。探测前拒绝播放列表，媒体工具禁用网络协议。图表标签重叠、资料图片超出面板时会停止渲染，可缩短标签或重新准备截图。
