# 验证记录

[English](https://runchengxie.github.io/finance-video-studio/validation/)

## 依赖兼容性（2026-11-05）

npm 直接依赖及文档依赖锁已更新到兼容的最新稳定版。TypeScript 保留 6.0.3，因为 typescript-eslint 8.72.1 声明支持 `>=4.8.4 <6.1.0`，尚不支持 TypeScript 7。Node 类型定义使用最新 24.x 版，与 Node 24 运行环境一致。Playwright 1.64.1 和 csv-parse 7.0.3 已是最新版。

依赖审计仍报告 ESLint 开发依赖中的 minimatch 中危漏洞（[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)）。上游当前版本范围选择 minimatch 10.2.6，修复版本为 11.0.1；本次未强制覆盖为上游未声明兼容的大版本。生产依赖审计不受此问题影响。

在 Node 24.22.2 与系统 FFmpeg 8.1.2 下，`npm run check`、全部 101 项测试、两种锁定 Chromium 的烟雾测试、固定合成审阅示例及中英文文档严格构建均通过。生产依赖审计未发现漏洞。生成的验证材料保存在 Git 仓库之外。

## 视觉补丁编辑（2026-11-11）

本机验证使用 Node 24.22.2、锁定的 Playwright Chromium、Noto Sans SC 和系统 FFmpeg 8.1.2。`npm run check` 通过，全部 113 项测试通过，包括新增的预览拖动/导出、逐帧绘制确定性、视觉缓存指纹和过期补丁用例。`npm run tools:smoke -- <外部目录>` 通过，覆盖新增的 `studio patch` 成功写入和过期哈希拒绝用例。固定合成审阅示例与锁定 Chromium 烟雾渲染也通过。本机未运行 MkDocs 构建。生成的验证材料保存在 Git 仓库之外。

## 关键画面自检、分镜与自定义场景（2026-11-11）

在同一台主机上，`npm run check` 通过，全部 120 项测试通过，包括新增的关键画面确定性、布局失败报告、分镜证据卡、自定义场景契约和数字声明用例。`npm run tools:smoke -- <外部目录>` 通过，覆盖 `studio look` 与 `studio patch`；固定合成审阅示例和锁定 Chromium 烟雾渲染也通过。本机未运行 MkDocs 构建。

`npm run benchmark:render` 在 60 个合成帧上比较完整重绘与复用竖版趋势图 DOM。两次本机运行中，完整重绘约 419–483 毫秒，属性更新约 100–107 毫秒（约 3.9–4.9 倍），第 0、15、30、45、59 帧截图完全一致。这是单机合成测量，不代表生产渲染器已切换，也不是通用性能承诺。生成的验证材料保存在 Git 仓库之外。

## 第一版验证记录

以下保留 2026-10-17 的本机验证结果，不表示之后每一版本都重新完成了这些检查。当时使用 Node 24.19.0、锁定的 Playwright Chromium 156.0.8078.4（revision 1248）、Noto Sans SC 5.2.8 和外部 FFmpeg 9.0.2。

- TypeScript 与 ESLint 通过，五组单元测试通过，包括拒绝非法输入、数值及时间边界。
- 三秒、90 帧的无声柱图经过编码、ffprobe 校验和完整解码。
- 两秒、60 帧的折线图测试使用本机生成的一秒 440 Hz 合成音，补足至两秒，得到 AAC 并完整解码。该声音只用于测试，未制作旁白。
- 完整虚构示例渲染 900 帧。ffprobe 确认 H.264、1280×720、yuv420p、30/1 fps、900 个解码帧与 30 秒时长。FFmpeg 使用 `-xerror` 完成解码，遇到解码错误即终止。
- 已人工检查首末 PNG，中文标题、字幕和数值在画面内。每帧执行字体与布局检查，关键帧检查图表颜色像素。
- 更新 csv-parse 7.0.3、typescript-eslint 8.71.2 后，npm audit 当时没有报告已知漏洞。这是当时的登记结果，不保证以后一直成立。

完整演示的三个平台相关 PNG SHA-256 样本保存在 [英文验证记录](https://github.com/runchengxie/finance-video-studio/blob/main/docs/validation.md)，用于保留当时证据，不作为跨操作系统的固定图像基准。

生成视频和帧始终放在 Git 之外。默认演示无声，不应称为完成配音的视频。Linux 独立 CI 结果见相应 PR 的检查记录。
