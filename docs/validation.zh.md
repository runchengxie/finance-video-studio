# 第一版验证记录

以下保留 2026-10-17 的本机验证结果，不表示之后每一版本都重新完成了这些检查。当时使用 Node 24.19.0、锁定的 Playwright Chromium 156.0.8078.4（revision 1248）、Noto Sans SC 5.2.8 和外部 FFmpeg 9.0.2。

- TypeScript 与 ESLint 通过，五组单元测试通过，包括拒绝非法输入、数值及时间边界。
- 三秒、90 帧的无声柱图经过编码、ffprobe 校验和完整解码。
- 两秒、60 帧的折线测试使用本机生成的一秒 440 Hz 合成音，补足至两秒，得到 AAC 并完整解码。这是测试音，不是旁白。
- 完整虚构示例渲染 900 帧。ffprobe 确认 H.264、1280×720、yuv420p、30/1 fps、900 个解码帧与 30 秒时长。FFmpeg 使用错误升级完成解码。
- 已人工检查首末 PNG，中文标题、字幕和数值在画面内。每帧执行字体与布局检查，关键帧检查图表颜色像素。
- 更新 csv-parse 7.0.3、typescript-eslint 8.71.2 后，npm audit 当时没有报告已知漏洞。这是当时的登记结果，不保证以后一直成立。

完整演示的三个平台相关 PNG SHA-256 样本保存在 [英文验证记录](https://github.com/runchengxie/finance-video-studio/blob/main/docs/validation.md)，用于保留当时证据，不作为跨操作系统的固定图像基准。

生成视频和帧始终放在 Git 之外。默认演示无声，不应称为完成配音的视频。Linux 独立 CI 结果见相应 PR 的检查记录。
