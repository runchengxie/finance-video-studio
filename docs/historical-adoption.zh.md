# 迁移历史制作项目

迁移工具会在源码目录之外另建项目，并创建待审的 v2 记录。旧授权不会变成改版视频的批准。原始源码、素材、成片及授权文件保持不变。

```sh
npm run studio -- adapt fixed-sample /absolute/legacy-cashflow /absolute/new-adaptation
npm run studio -- adapt full-timeline /absolute/legacy-full-film /absolute/new-adaptation
npm run studio -- adapt external-audio /absolute/legacy-audio-project /absolute/new-adaptation
```

目前只支持以下三种固定目录和数据格式。固定现金流样片包含 `src/data.json`、`src/segments.json`、`public/narration.wav`，按原值和原单位重建包含流入和流出的现金流关系。完整时间轴项目包含 `src/facts.json`、`src/scenes.json`、`src/timeline.json`、`src/captions.json` 及 `public/` 中选定的分场音轨。外部音轨项目包含 `src/facts.json`、`src/scenes.json`、`src/cues.json`，以及通过精确哈希绑定本地音频的 `production-authorization.json`。

输出保留复制的原始 JSON、选定媒体、源文件与副本的哈希、新清单、`adaptation.json` 和待审记录。报告列出文字、数据、时序和画面变化、映射关系及不支持的功能。复制旧来源记录不代表重新核实了事实。未映射的定制图形会阻止进入可批准状态；保留口播摘录也不代表复现了原来的财经图解。不会自动执行公司名称纠错。

外部音轨适配保留其原有的“就近取整到帧”规则，并在报告中说明。它与新 SRT 导入“起点向下、终点向上”的规则不同。适配器不会为了满足新规则而偷偷挪动旧字幕；原时间轴如有重叠或无效区间，应明确解决。

批准前要检查映射、单位、来源、限定条件、时序、未复现的图形关系和素材使用权。存在未支持功能时，应先补映射或重新编排，再生成新审核快照。只有后续明确要求、且精确批准的版本才能重做成片。这些命令都不会发布视频。
