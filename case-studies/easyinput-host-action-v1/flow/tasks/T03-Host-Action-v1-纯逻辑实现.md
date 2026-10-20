# T03 · Host Action v1 纯逻辑实现

- **背景**：T02 已冻结协议；当前 starter 尚未实现 Host Action。
- **目标**：先用宿主测试固定规范小写 UUID 校验、完整配置值解析、Keymap 按下／松开语义和共享报告编码，再做最小纯逻辑实现。
- **输入**：`flow/tasks/T02-Host-Action-v1-固定兼容协议.md`、现有配置／Keymap／App Command 容器。
- **产出路径**：`components/keyboard/include/keyboard/host_action_protocol.h`、`components/keyboard/src/host_action_protocol.cpp`、`components/keyboard/include/keyboard/keymap.h`、`components/keyboard/src/keymap.cpp`、`components/keyboard/src/config_payload.cpp`、两侧 CMake 接线，以及 `host_test/host_action_protocol_tests.cpp`、`config_payload_tests.cpp`、`config_state_tests.cpp`、`keymap_tests.cpp`、`firmware_source_contract_tests.cpp`。
- **验收标准**：合法 UUID 接受；大写、长度、连字符或字符错误 fail closed；不增加 version／nil 限制；按下一个事件、松开无事件；固定 wire 字段通过测试；本节点不接 USB／BLE。
- **状态**：2026-08-28 已完成纯逻辑与宿主测试；USB／BLE、能力声明、ESP-IDF 构建与实板均未进入。

## 合同与实现结果

- T02 合同门检查通过：Report ID `0x11`、kind `0x05`、chunk index `0`、total chunks `1`、data length `36`，线上数据只包含不带 `host_action:` 前缀的 UUID ASCII。
- 配置与 Keymap 保留完整 `host_action:<UUID>`；大写、长度错误、连字符位置错误和非法字符返回 `UnknownAction`，`ConfigState` 不覆盖已生效配置。
- nil UUID 和不限定 version 的其他规范小写 UUID 保持可接受；没有自动小写。
- press 生成一个 `FirmwareEventKind::HostAction`，release 生成 `None`。
- 共享编码器产生固定 63 字节 payload：`[0..3] = 0x05/0/1/36`，`[4..39]` 为 UUID，`[40..62]` 清零；测试显式确认状态 kind 仍为 `0x04`。

## 测试命令与证据

```bash
cmake -S host_test -B build-host -DCMAKE_BUILD_TYPE=Debug
cmake --build build-host --target host_action_protocol_tests config_payload_tests config_state_tests keymap_tests firmware_source_contract_tests -j2
ctest --test-dir build-host --output-on-failure -R '^(host_action_protocol_tests|config_payload_tests|config_state_tests|keymap_tests|firmware_source_contract_tests)$'
cmake --build build-host -j2
ctest --test-dir build-host --output-on-failure
```

- 测试先行红灯：只加测试后，定向构建因 `keyboard/host_action_protocol.h` 不存在而失败，退出码 `2`。最初裸 shell 还因 `cmake` 未在 `PATH` 中返回 `127`，这是工具环境问题，不计为功能红灯；后续使用已有 ESP-IDF 5.5 Python 环境内的 CMake。
- 最小实现后：定向测试 `5/5` 通过。
- 完整回归首轮 `57/58`：唯一失败是旧 starter 源码守卫仍禁止任何 Host Action 纯逻辑。将其收窄为“允许纯逻辑、仍禁止传输和能力接入”后，完整宿主测试 `58/58` 通过。

## 范围证据与未验证项

- `git diff -- main/app_main.cpp main/platform/usb_hid.cpp main/platform/usb_hid.h main/platform/ble_hid.cpp main/platform/ble_hid.h` 无输出；源码合同测试同时阻止 Host Action 接入上述传输与能力路径。
- 未验证：KEY1—KEY8 参数化覆盖（T04），USB／BLE 适配和真实发送（T06），`"host_action_v1": true` 与 BLE 512 字节预算（T08），ESP-IDF 5.5.5 默认构建（T09），NVS Host Action 真实持久化链路，烧录与实板行为。
