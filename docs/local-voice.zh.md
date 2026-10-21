# 可选的 Windows 本机配音

Windows 的 SAPI 语音接口只在操作者明确要求本机配音，并选定已安装的声音后运行。预检和普通渲染不会调用它。本机配音失败时会直接报错，不会转用云端服务或下载语音模型。

```sh
npm run studio -- voices
npm run studio -- voice /absolute/project.json "Microsoft David Desktop" /absolute/new-voice --execute-local
npm run studio -- voice-demo /absolute/new-fixed-comparison "Microsoft David Desktop" --execute-local
```

`voice` 保留原项目、字幕时间和批准，另建短 WAV 片段、实测时长、合成音轨及 `proposal.json`。建议的字幕时间只根据各句音频的实测时长计算，尚未逐词对齐，也未经人工核对读音。将新音轨导入项目固定的 `inputs/` 目录后，需要另建时间轴并审核新的完整快照。不支持的系统或不可用的声音会报错，不会自动改用其他声音或服务。

`voice-demo` 只处理代码锁定的 36 秒虚构样片，生成固定文案的旁白，并把相同音轨用于两个对照版本。不能传入其他稿件或音频。超过 36 秒会停止，不会擅自加速或截断；不足部分补静音。画面仍用固定的对照字幕时间，不声称已经与语音逐句对齐。两个视频均为合成演示，尚未人工听审。

自然度、人名、数字、停顿和音画对应仍需要人工听校。音频探测和完整解码不能替代这些判断。CI 继续使用测试音，不调用 SAPI。
