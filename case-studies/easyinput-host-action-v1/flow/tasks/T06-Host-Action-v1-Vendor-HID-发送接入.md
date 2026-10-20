# T06 · Host Action v1 Vendor HID 发送接入

- **背景**：T03 的共享编码需要接入现有 App Command 发送路径，不能在 USB 与 BLE 各写一套协议。
- **目标**：USB／BLE 复用同一编码结果，并沿用现有单通道选择和连接 owner／epoch 保护。
- **输入**：T02 固定 wire 合同、T03 共享编码、现有 Vendor HID App Command 路径。
- **产出路径**：必要的最小平台适配与宿主源码合同测试。
- **验收标准**：Report ID、kind、单 chunk 和 36 字节数据不变；状态 kind 继续为 `0x04`；USB 优先否则 BLE且不双发；不改 HID 描述符、BLE GATT 或设备身份。
- **状态**：已完成（2026-08-28）

## 实际修改

- 事件分发：`main/app_main.cpp` 为 `FirmwareEventKind::HostAction` 增加可定位的 `host_action` 类型标识，继续走原有 `route_for_firmware_event()` 和 USB epoch 优先分支。
- USB：`main/platform/usb_hid.{h,cpp}` 调用共享 `encode_host_action_v1()`，将完整 63 字节编码结果按原有 epoch 锁和 App Command 队列入队；旧 Fixed Text／Hotkey／Config Ack 仍使用原 `kReportIdAppCommand` 入口。
- BLE：`main/platform/ble_hid.{h,cpp}` 调用同一 `encode_host_action_v1()`，将同一完整 payload 交给原有 `send_input_report()` 和 owner 校验队列。
- 宿主证据：`host_test/transport_routing_tests.cpp` 新增 Host Action 在 BLE 已连接／未连接时都为 `UsbFirst` 的测试；`host_test/firmware_source_contract_tests.cpp` 从“starter 不得接入”更新为共享编码、事件接入、USB／BLE 同边界、选定通道失败不补发和能力字段未提前加入的源码合同。

## 固定 payload 证据

- 单一事实源仍为 `components/keyboard/include/keyboard/host_action_protocol.h` 与 `components/keyboard/src/host_action_protocol.cpp`：Report ID `0x11`、kind `0x05`、chunk index `0`、total chunks `1`、data length `36`。
- `host_test/host_action_protocol_tests.cpp` 逐字节断言 `[0]=0x05`、`[1]=0`、`[2]=1`、`[3]=36`、`[4..39]` 是不带 `host_action:` 前缀的 UUID ASCII，`[40..62]` 全为 `0`；同时断言状态响应 kind 仍为 `0x04` 且与 `0x05` 不同。
- USB 和 BLE 均直接使用共享编码产生的 `std::array<..., 63>`；平台文件没有新增 Host Action kind、数据长度或 UUID 常量，也没有把 data length 改为 48。

## 单通道与兼容证据

- `route_for_firmware_event()` 对 Host Action 沿用 `UsbFirst`，测试覆盖 `ble_connected=true/false`。
- `dispatch_firmware_event()` 在 USB epoch 有效时只调用 `send_firmware_event_for_epoch()` 并立即 `return`；即使 USB 入队失败，也只记录 `BLE fallback suppressed`，不跨通道补发。仅在 USB epoch 为 0 时才调用 BLE，因此不会双连接双发。
- USB 保留 endpoint epoch 校验与 `pending_app_command_reports_`；BLE 保留 `BleOwnerToken` 校验与 `pending_input_reports_`，未以 App 端去重替代固件路由。

## 测试命令与结果

- 红灯：配置 `<temporary-host-build-dir>` 后，先运行 `ctest --test-dir <temporary-host-build-dir> -R '^(transport_routing_tests|firmware_source_contract_tests)$' --output-on-failure`；`transport_routing_tests` 通过，`firmware_source_contract_tests` 在 `dispatch.find("FirmwareEventKind::HostAction")` 处按预期失败，结果 `1/2` 通过。
- 中间回归：最小接入后首次为定向 `5/6`、完整 `57/58`；原因是测试把函数名 `encode_host_action_v1` 误判为能力字段，收紧为只禁止带引号的 JSON 键 `"host_action_v1"` 后解决，未改协议实现。
- 最终定向：`ctest --test-dir <temporary-host-build-dir> -R '^(host_action_protocol_tests|config_payload_tests|config_state_tests|keymap_tests|transport_routing_tests|firmware_source_contract_tests)$' --output-on-failure` 为 `6/6` 通过。
- 最终完整：`ctest --test-dir <temporary-host-build-dir> --output-on-failure` 为 `58/58` 通过；其中旧配置、Keymap、HID report queue、status HID、transport routing 和 USB endpoint arbiter 测试全部保持通过。

## 禁止范围与未验证项

- `git diff -U0` 显示平台变更只位于 include、Host Action event switch、共享 payload 入队帮助函数与方法声明；无 HID 描述符、BLE GATT、设备名称，VID/PID，GPIO，BOOT，电源或 Flash 分区改动。
- 未增加 `"host_action_v1": true`，BLE 状态 512 字节能力检查仍留给 T08。
- 未运行 ESP-IDF 平台构建（T09）；USB／BLE 平台文件本轮由宿主源码合同测试覆盖，不冒充编译或真机发送结果。
- 未烧录，未验证 EasyInput 0.1.33 真机 UUID 映射、USB／BLE 实际收包、NVS 真实持久化或实板行为。
