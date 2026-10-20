# EasyInput Host Action v1 复刻案例

> 本目录是基于 EasyInput Maker 官方课程起点完成的学习、实现和验证记录，不是原创硬件平台。全部内容遵守本目录的 PolyForm Noncommercial 1.0.0 和第三方许可证。

## 案例目标

为 EasyInput V2.0 的八个主键补齐 Host Action v1：固件保存 App 提供的 UUID，在按键 press 时编码固定 App Command，经 USB 或 BLE 单通道发送，由 EasyInput App 在本机执行“打开应用”等映射。

本案例是第 2 课 AI 硬件工程实践，与根目录赛博塔罗网页没有源码依赖。赛博塔罗主要使用普通 HID 键盘、固定文字和语音输入能力。

## 已完成结果

- 冻结并实现 Host Action v1 UUID、配置与 63 字节共享编码合同。
- KEY1–KEY8 使用同一解析和事件链路；press 触发一次，release 不重复。
- USB 与 BLE 复用同一编码，双连接时保持单通道路由。
- 能力状态包含 `host_action_v1`，并保持 BLE 512 字节预算。
- 60 项宿主测试通过，ESP-IDF 5.5.5 默认构建通过。
- 固件写入、App 配置同步及 USB-only、BLE-only、双连接、旧动作兼容和实际打开 Calculator 均完成真机验证。

详细、脱敏后的证据位于 `flow/tasks/` 和 `flow/进展.md`。这些记录是课程案例档案，不是整个新仓库的项目控制层。

## 宿主测试

```bash
cmake -S host_test -B build-host -DCMAKE_BUILD_TYPE=Debug
cmake --build build-host
ctest --test-dir build-host --output-on-failure
```

## ESP-IDF 构建

目标环境为 ESP-IDF 5.5.5、ESP32-S3：

```bash
idf.py --version
idf.py build
```

构建成功只证明能够生成固件，不代表已经烧录或通过真机验证。烧录会覆盖设备固件；本仓库不会自动执行烧录、擦除或复位。

### 发布前复验

2026-10-20 在 macOS、ESP-IDF v5.5.5 环境完成：

- 宿主测试 `60/60` 通过；
- `idf.py build` 成功生成 ESP32-S3 固件；
- `easy_input_keyboard.bin` 大小为 `0x190800` 字节，3 MiB 应用分区剩余约 48%；
- 本次复验没有执行烧录、擦除、复位或串口访问。

## 学习入口

- `docs/teaching/what-the-12-steps-teach.md`：完成 12 步后真正应该学会什么。
- `docs/hardware/easyinput-v2-safety.md`：GPIO、BOOT、共享电源和板级安全边界。
- `flow/plan.md`：课程节点与完成状态。
- `flow/tasks/`：每一步的目标、证据和边界。

## 来源与许可

准确基线、修改范围和 Required Notice 见 [`UPSTREAM.md`](UPSTREAM.md)。

- 上游仓库：[`CY-CHENYUE/easy-input-maker`](https://github.com/CY-CHENYUE/easy-input-maker)
- 课程起点：`course/host-action-v1-starter`
- 起点提交：`743368a`
- 许可证：本目录 [`LICENSE`](LICENSE) 与 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)
