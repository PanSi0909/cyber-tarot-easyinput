# EasyInput Host Action v1 案例 · AI 贡献指南

本目录是 `cyber-tarot-easyinput` 单仓库中的 EasyInput Maker 课程复刻案例。AI Agent 和贡献者必须把所有准备提交的内容视为公开材料，并把改动限制在本案例目录；网站改动属于仓库根目录。

## 开始前

1. 阅读 `README.md`、`AI_DEVELOPMENT.md` 和当前任务相关代码。
2. 涉及引脚、BOOT、GPIO8、USB、音频、睡眠或唤醒时，先阅读 `docs/hardware/easyinput-v2-safety.md`。
3. 涉及许可证、第三方代码或素材时，检查 `LICENSE`、`THIRD_PARTY_NOTICES.md` 和对应资源说明。

## 开发边界

- 目标硬件为 EasyInput V2.0 / ESP32-S3，构建基线为 ESP-IDF 5.5.5。
- 可宿主测试的纯逻辑优先放在 `components/keyboard/`；ESP-IDF 硬件适配放在 `main/platform/`。
- 不擅自修改 GPIO、BOOT 流程、分区、设备身份、通信协议或 GPIO8 共享电源生命周期。
- 不提交真实 Wi-Fi 凭据、同步密钥、账号、设备唯一标识、本机绝对路径、原始串口输出、内部仓库信息或未整理的执行记录。
- 运行日志不得输出密码、密钥、SSID、网络主机、BLE 地址、用户文本或用户自定义快捷键内容。
- 构建成功、自动测试通过、烧录成功和实板功能正常是不同证据，报告时必须明确区分。

## 来源与版本边界

- 本案例来源、基线提交和 Required Notice 见 `UPSTREAM.md`。
- 导入基线为上游 `course/host-action-v1-starter`；当前快照已经完成课程要求的 Host Action v1 实现与验证。
- 不把本案例描述为原创硬件平台，也不机械覆盖上游作者、版权或许可证信息。
- 产品专属 OTA、签名、发布与部署工具不进入 Maker 的任何分支。公共固件同步必须逐文件审计，并分别通过宿主测试和 ESP-IDF 5.5.5 构建。
- 跨仓同步不得削弱本仓库的公开与隐私边界；禁止为了机械保持源码一致而恢复会输出用户内容、网络信息或设备标识的日志。

## 默认验证

```bash
cmake -S host_test -B build-host -DCMAKE_BUILD_TYPE=Debug
cmake --build build-host
ctest --test-dir build-host --output-on-failure
idf.py build
```

构建目录、二进制、映射文件、缓存和日志不得进入版本控制。烧录会覆盖设备固件，只有使用者明确要求并确认目标设备后才能执行。

## 公开贡献

- Issue 和 Pull Request 只记录可公开复现的现象、必要证据和最终修改。
- 不粘贴完整私有日志；仅摘录完成脱敏且与问题直接相关的最小片段。
- 本案例材料遵守本目录的非商业许可证；第三方材料继续遵守其原许可证。

<!-- project-flow-cy:start -->
## 课程记录

本目录中的 `flow/` 是第 2 课已经完成并脱敏的实践档案，不是整个单仓库的项目控制层。`docs/` 保留固件技术、硬件边界和教学资料。

### 开工前

1. 阅读 `flow/plan.md`、`flow/进展.md` 顶部一条记录和当前任务相关文档。
2. 有具体任务卡时，阅读 `flow/tasks/` 中对应文件。
3. 所有准备写入 `flow/` 的内容同样视为将公开发布，不记录内部讨论、私有仓库、人员隐私、凭据、原始日志或未经整理的执行过程。

### 收工前

1. 仅在确有公开协作价值时，向 `flow/进展.md` 顶部追加脱敏后的结果、公开产出路径和下一步。
2. 可公开的推进决策写入 `flow/decisions.md`；可公开且可复用的问题经验写入 `flow/踩坑记录.md`。
3. 进展与交接只写“指针 + 增量”，不复制产品文档或代码内容。

### 目录与规则

- `flow/charter.md`：项目目标、范围、约束与成功标准。
- `flow/plan.md`：已经确认的实施计划。
- `flow/进展.md`：公开协作进展，最新记录置顶。
- `flow/decisions.md`：可公开的过程决策。
- `flow/踩坑记录.md`：可公开的问题与经验。
- `flow/tasks/`：任务模板与公开任务卡。
- `flow/规范/`：`project-flow-cy` 的协作方法规范。
- 完整规则见 `flow/规范/工作流程.md` 和 `flow/规范/文档维护SOP.md`。
<!-- project-flow-cy:end -->
