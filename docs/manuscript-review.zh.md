# 配音与渲染前的文稿审阅

这套流程记录本地审阅状态，不提供模型，不自动核验事实，也不会发布视频。现有 v1 覆盖标题和三段短字幕，每段最长 45 字；完整长稿尚不能直接进入此接口。

写稿和改稿前先使用[稿件审阅提示词](editorial-review.md)。本页说明v1三段短字幕接口，完整文稿使用[v2制作审核](production-rendering.md)，两者都遵循同一套编辑要求。

先核对来源和事实，再准备三点稿件、润色、检查事实差异，随后由人明确批准。第一段从第零帧开始。真实内容可以使用 `fictional: false`，这个字段不会证明内容已经核验。

## 技能与执行记录

human-writing 是可选的本机技能，代码仓库不包含它的第三方指令，也没有内置完整的模型执行器。技能自带的 `check_prose.py` 是文字规则检查器，不能替代改稿、事实核对或人类批准。CI 使用合成协议桩，明确记录 `skillUse: "not_used"`。

可以在自己的代理或编辑器中使用已安装技能，手动导入结果。也可以显式配置受信任的本地程序；项目不会自动发现或执行它，不会安装未知技能或自动调用付费服务。

## 默认手工流程

文稿、来源、音频、审阅记录和个人配置保存在源码之外。先准备严格的项目 JSON，再初始化待处理记录。

```sh
npm run review -- init /absolute/draft.json /absolute/01-pending.json
npm run review -- status /absolute/01-pending.json
```

初始状态为 `pending_execution`。记录保存原稿、输入哈希、策略词表、执行来源、润色稿、变更说明、事实差异和批准。输出只创建新文件，不覆盖旧版本；显示的缓存状态不作为批准依据。

在外部文件中保存完整的润色结果，字段为 `inputHash`、`decision`、`polished`、`changeNotes`、`skillUse`。`inputHash` 从待处理记录复制。接受时提供完整项目对象；拒绝时使用 `decision: "rejected"`、`polished: null` 并说明原因。

`skillUse` 应如实填写。没有实际使用技能时填写 `not_used`；只有确实由操作者使用后，手工结果才可填写 `operator_reported`，不能冒充自动适配器执行。

```sh
npm run review -- import /absolute/01-pending.json /absolute/polish-result.json /absolute/02-imported.json
npm run review -- status /absolute/02-imported.json
```

导入只会得到等待批准、事实变化或拒绝等状态，不会自动批准。缺少执行器或结果时继续待处理。润色只能修改标题和字幕文字；图表数值、标签、单位、时间轴等变化，需要重新建立原稿审阅。

## 事实差异与明确批准

检查器逐字段比较数字、常见单位、日期、引用标识与保守限定词。它可能误报或漏报，不能理解完整语义，也不能判断来源质量。即使数字未变，因果或主语仍可能变化，因此仍需人工检查完整稿件、计算和引语语境。

人工核对后，在外部批准选项 JSON 中填写非空 `reviewer`、`factReviewNotes` 和未来的 UTC ISO 时间 `expiresAt`。存在事实词变化时，还要提供 `differenceReviewNotes` 说明处理结果。程序记录操作者的确认，不判断说明是否足够。

```sh
npm run review -- approve /absolute/02-imported.json /absolute/approval-options.json /absolute/03-approved.json --confirm-review
npm run review -- status /absolute/03-approved.json
npm run render -- /absolute/polished-project.json /absolute/03-approved.json /absolute/empty-video-output
```

批准绑定完整润色项目及审阅内容的哈希。修改原稿、策略、审计说明或项目，或者批准到期，都会使它失效。这是本地工作流记录，不是抵御操作者伪造的密码学身份系统。

命令末尾可以追加已许可的本地音频，以及可选 CSV。CSV 在批准校验前载入，必须与被批准项目一致。无声渲染应按无声作品描述。

## 可选本地适配器

默认配置为 `{"mode":"manual"}`。本地执行模式必须显式提供绝对配置路径、程序路径、已安装技能路径及参数数组。配置放在源码之外，绝不把命令拼成 shell 字符串。

```sh
npm run review -- init /absolute/draft.json /absolute/01-pending.json /absolute/local-config.json
npm run review -- run /absolute/01-pending.json /absolute/local-config.json /absolute/02-imported.json --execute-local
```

配置的 `extraTerms` 在初始化时绑定输入哈希；策略变化需要新建审阅。只有显式执行参数才能启动本地程序，缺少程序、技能文件、超时或返回格式错误都会失败。手工模式不会继承旧批准来证明新润色已执行。

程序通过 stdin 接收版本、输入哈希、原稿、技能路径和任务说明，通过 stdout 返回严格的结果对象。完整配置和协议字段见 [英文指南](https://github.com/runchengxie/finance-video-studio/blob/main/docs/manuscript-review.md)。`adapter_reported` 只是适配器自报，不独立证明技能被正确执行。适配器可能拥有自己的网络或环境权限，操作者应在显式触发前了解其行为。

## 固定离线示例

```sh
npm run review:example -- /absolute/empty/review-example
```

示例只接受输出目录，用固定虚构数据模拟待处理、数值变化与明确的测试批准，再渲染并解码 90 帧。它不接受真实稿件，不代表人类编辑批准，也不声称调用了真实 human-writing。

固定 demo 有源码锁定的内容哈希，修改数据后不能继续走未审阅路径。没有通用的跳过审阅参数。CI 在无网络环境中运行合成状态测试、审稿示例和视频烟测。
