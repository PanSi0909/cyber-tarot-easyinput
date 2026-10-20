# 贡献指南

欢迎提交文档修正、可复现的问题和范围清楚的小型改进。

## 开始前

1. 先确认问题属于网站还是 `case-studies/easyinput-host-action-v1/` 固件案例。
2. 不提交 API 密钥、Wi-Fi 凭据、设备唯一标识、私人文本或原始串口日志。
3. 网站改动运行 `node --test tests/*.test.mjs`。
4. 固件案例改动遵守该目录的 `AGENTS.md`，先运行宿主测试；不要自动烧录。

Pull Request 请说明目标、实际运行过的验证，以及尚未验证的真机行为。自动测试、ESP-IDF 构建、烧录和真人观察是不同证据，不能互相替代。

提交内容必须符合 [`LICENSE-SCOPE.md`](LICENSE-SCOPE.md) 的许可证边界。
