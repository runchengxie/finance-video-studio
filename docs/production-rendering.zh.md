# 审核后生成多场景视频

v2 渲染器提供六类原创模板，输出 1920×1080、30 fps 视频。完整文稿、字幕、图表数据、来源、输入哈希和渲染器版本共同组成审核快照。v1 命令和审核记录继续独立使用。

## 审核具体版本

```sh
npm run studio -- review init /absolute/project.json /absolute/new-review.json
npm run studio -- review import /absolute/new-review.json /absolute/manual-result.json /absolute/imported-review.json
npm run studio -- review status /absolute/imported-review.json
npm run studio -- review approve /absolute/imported-review.json /absolute/approval-options.json /absolute/approved-review.json --confirm-review
npm run studio -- render /absolute/project.json /absolute/approved-review.json /absolute/new-build /absolute/cache
```

人工整理的结果包含 `inputHash`、`decision`（`accepted` 或 `rejected`）、完整 `polished` 快照、`changeNotes` 和 `skillUse`（`not_used` 或 `operator_reported`）。保留原文时可复制审核记录中的 draft 快照。导入结果不会自动批准。润色只能修改允许的文字字段；来源引用、图表数据、时间轴、音频或渲染参数变化都需要新快照。接受润色后，先把文字应用到新的项目版本，再渲染这个版本。

批准参数包含 `reviewer`、`factReviewNotes`、事实词变化时必填的 `differenceReviewNotes`，以及 UTC ISO 格式的 `expiresAt`。确认标记记录操作人的明确决定；此命令不会调用写作技能。v1 文档中的 human-writing 适配器尚不支持 v2 协议。修改缓存状态字段无法获得批准。

合成前和最终交付前会重新读取输入与审核记录。文件变化、批准过期、审核内容被编辑或渲染代码变化都会阻止交付。待审项目在创建输出或缓存前就被拒绝。每次使用新输出目录，缓存与输出均须避开输入和源码目录。

## 画面、时序和缓存

指标、对比、瀑布图、趋势、流程和证据摘录共享字幕与来源安全区、锁定的本地字体，以及 `contentLanguage` 指定的中英文界面标签。图表单位和时间标签由作者明确提供。动画由整数帧和字幕 ID 决定；未解决的时间标记会阻止生成。离线渲染检查字体、文字边界和字幕碰撞。过长文字应精简或拆分场景，溢出会报错。

场景被拆成短动画和静止保持段，并在字幕边界切分。缓存键包含内容、实际输入哈希、代码与依赖锁、字体、浏览器、FFmpeg 和编码参数。复用前核对收据、SHA-256 与实际媒体解码结果。缓存不会替代审核。失败构建保留诊断，无法交付 `final.mp4`。

`final.mp4`、`build.json`、`timeline/` 分别保存已验证视频、各段缓存结果和耗时，以及字幕、章节和分镜。画面字幕直接使用同一时间轴。音轨由清单中的素材 ID 明确选择；背景混音与响度处理也须明确配置。完整解码只能证明技术完整性，报告仍保留 `manualListening: false`。

## 固定对比样片

```sh
npm run production:example -- /absolute/new-example improved
npm run production:example -- /absolute/new-comparison legacy-comparison
```

两个版本使用相同的 36 秒虚构内容、数值、字幕时间、测试音和尺寸。对照版用独立数字卡片，改进版采用共同零基线、跟随字幕的视觉重点与连接差额。其余场景展示瀑布图、流程和趋势。该入口仅接受固定版本名称，不能传入其他项目或外部音轨；单独设置 `fictional: true` 也无法跳过审核。每次运行都保留首次生成与缓存复用的实测耗时。测试音不代表旁白。

```sh
node --import tsx test/production-visuals.ts /absolute/new-template-inspection
```

该命令保留六类模板、动画中间帧及 360／390 像素预览。缩图用于发现信息过密的问题；自动检查不能证明手机端易读、事实正确或配音自然。
