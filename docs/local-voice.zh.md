# 可选的 Windows 本机配音

SAPI 仅在操作人明确要求本机执行、并选定已安装声音后运行。预检和普通渲染不会调用它。没有云端回退，也不会下载语音模型。

```sh
npm run studio -- voices
npm run studio -- voice /absolute/project.json "Microsoft David Desktop" /absolute/new-voice --execute-local
npm run studio -- voice-demo /absolute/new-fixed-comparison "Microsoft David Desktop" --execute-local
```

`voice` 保留原项目、字幕时间和批准，另建短 WAV 片段、实测时长、合成音轨及 `proposal.json`。建议字幕仅基于分句时长，不代表逐词对齐或读音审核。将新音轨导入稳定 `inputs/` 后，需要另建时间轴并审核新的完整快照。不支持的系统或不可用的声音会报错，不会自动改用其他声音或服务。

`voice-demo` 只处理代码锁定的 36 秒虚构样片，生成固定文案的旁白，并把相同音轨用于两个对照版本。不能传入其他稿件或音频。超过 36 秒会停止，不会擅自加速或截断；不足部分补静音。画面仍用固定的对照字幕时间，不声称已经与语音逐句对齐。两个视频均为合成演示，尚未人工听审。

自然度、人名、数字、停顿和音画对应仍需要人工听校。音频探测和完整解码不能替代这些判断。CI 保持使用测试音，不调用 SAPI。
