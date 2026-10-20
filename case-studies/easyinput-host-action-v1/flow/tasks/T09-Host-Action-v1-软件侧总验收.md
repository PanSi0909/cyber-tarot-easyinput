# T09 · Host Action v1 软件侧总验收

- **背景**：局部测试通过不等于完整固件可构建。
- **目标**：重新配置、发现并运行全部宿主测试，再用项目锁定的 ESP-IDF 5.5.5 完成 `v2`／`esp32s3` 默认构建。
- **输入**：T03、T04、T06、T08 的当前工作区和测试清单。
- **产出路径**：被忽略的宿主构建目录、`build/` 固件产物与本公开脱敏记录。
- **验收标准**：发现数等于执行数等于通过数，0 失败；默认构建成功并记录镜像与分区余量；清楚区分逻辑通过、构建通过和尚未烧录／真机验证。
- **状态**：已完成（2026-08-28）；宿主测试 `60/60`，ESP-IDF 5.5.5 默认构建通过，未烧录、未运行 App、未做真机验证。

## 操作前状态与旧证据边界

- 分支 `course/host-action-v1-starter`，基线提交 `743368a`；操作前工作区已保留 T03／T04／T06／T08 的生产和测试差异。
- T08 记录的完整宿主测试 `59/59` 和最大状态 `512/512` 仅是历史证据；本卡下方数字都来自本轮重新配置和执行。
- 操作前 `git status --short` 已含上述 27 个跟踪文件差异与 4 个未跟踪 Host Action 文件；本轮不撤销、重写或冒充先前节点的差异。

## CTest 清单核对与数量变化

- 课程起点记录：`57/57`。
- T03 新增专名 `host_action_protocol_tests`，发现数到 58。
- T04 将 KEY1—KEY8 参数化证据放在既有 `config_payload_tests` 中，因此当时仍为 58，没有独立 CTest 名称。
- T06 仅增加现有测试内的路由和源码合同用例，数量仍为 58。
- T08 新增专名 `host_action_capability_status_tests`，发现数到旧记录的 59。
- 本轮首次全新配置后实际发现 59 项：`host_action_protocol_tests` 和 `host_action_capability_status_tests` 已注册，但指定的 `host_action_key_bindings_tests` 缺失。
- 最小修复是增加 `host_test/host_action_key_bindings_tests.cpp` 及一行 CMake 注册；它将 T04 已有的八键契约变成可独立发现的专名测试，不修改生产逻辑。
- 重新配置后实际发现 **60** 项；与起点的差额正好是三个 Host Action 专名测试：`host_action_protocol_tests`、`host_action_key_bindings_tests`、`host_action_capability_status_tests`。

## 本轮完整 CTest 清单

```text
01 board_pins_tests
02 board_pins_v2_tests
03 audio_io_arbiter_tests
04 audio_control_wire_tests
05 audio_packet_wire_tests
06 audio_session_tests
07 agent_status_tests
08 awake_wait_planner_tests
09 boot_led_sequence_tests
10 cold_boot_feedback_tests
11 battery_estimator_tests
12 ble_advertising_state_tests
13 ble_connection_profile_tests
14 ble_management_gate_tests
15 ble_input_scheduler_tests
16 ble_fixed_text_stream_tests
17 ble_owner_recovery_tests
18 ble_persistence_policy_tests
19 ble_status_wire_tests
20 config_payload_tests
21 config_receiver_tests
22 config_state_tests
23 config_status_tests
24 debounce_tests
25 diagnostic_command_tests
26 encoder_tests
27 encoder_press_gesture_tests
28 firmware_source_contract_tests
29 held_keyboard_state_tests
30 host_action_protocol_tests
31 host_action_capability_status_tests
32 hid_report_queue_tests
33 hid_keycode_tests
34 input_feedback_tests
35 input_test_tests
36 speaker_assets_wifi_policy_tests
37 ima_adpcm_decoder_tests
38 sound_asset_store_tests
39 sound_asset_reader_tests
40 speaker_assets_store_executor_tests
41 speaker_assets_flash_runner_tests
42 speaker_assets_protocol_tests
43 speaker_assets_wifi_wire_tests
44 speaker_assets_session_tests
45 speaker_assets_runtime_tests
46 gatt_status_snapshot_tests
47 host_action_key_bindings_tests
48 keyboard_snapshot_delivery_tests
49 keymap_tests
50 platform_selection_tests
51 peripheral_power_lease_tests
52 power_cycle_tests
53 power_policy_tests
54 speaker_audio_contract_tests
55 speaker_probe_status_tests
56 speaker_playback_tests
57 speaker_service_startup_tests
58 status_hid_protocol_tests
59 transport_routing_tests
60 usb_hid_endpoint_arbiter_tests
```

## 实际命令与退出结果

```bash
mktemp -d <temporary-host-build-template>
# exit 0 -> <temporary-host-build-dir>

<idf-python-env>/bin/cmake -S host_test -B <temporary-host-build-dir> -DCMAKE_BUILD_TYPE=Debug
# exit 0

<idf-python-env>/bin/ctest --test-dir <temporary-host-build-dir> --show-only=json-v1
# exit 0；修复前 59，修复后 60

<idf-python-env>/bin/cmake --build <temporary-host-build-dir> -j4
# exit 0

<idf-python-env>/bin/ctest --test-dir <temporary-host-build-dir> --output-on-failure
# exit 0；发现 60，执行 60，通过 60，失败 0

<temporary-host-build-dir>/host_action_capability_status_tests
# exit 0；本轮重新输出最大 final=512，limit=512，remaining=0

bash ../.codex/skills/esp-idf-cy/scripts/doctor.sh --project .
# exit 0；READY=yes，IDF_VER=v5.5.5，IDF_COMMAND_VERSION=ESP-IDF v5.5.5

source <esp-idf-root>/export.sh >/dev/null 2>&1 && idf.py --version && idf.py build
# 首次 exit 1；沙箱禁止 psutil 调用 sysctl 读取进程，尚未进入编译，属执行环境失败
# 在允许读取进程信息的同一 5.5.5 环境原命令重跑 exit 0

python3 ../.codex/skills/easyinput-board-cy/scripts/check_board_baseline.py .
# exit 0；1 PASS，2 WARN，0 FAIL

git diff --check
# exit 0
```

## 実主测试和能力预算结果

- CTest 完成条件：**发现 60 = 执行 60 = 通过 60，失败 0**，`100% tests passed out of 60`。
- 三个指定 Host Action 测试均在实际清单中并通过：编号 30 `host_action_protocol_tests`、编号 31 `host_action_capability_status_tests`、编号 47 `host_action_key_bindings_tests`。
- 本轮独立字节审计：full `408/512`、compact `483/512`、speaker probe `512/512`、confirmation `444/512`、battery 最终 `512/512`、BLE fallback `241/512`；最大 512，剩余 0。

## ESP-IDF 默认构建证据

- `doctor.sh` 返回 `READY=yes`；实际 `idf.py --version` 为 **ESP-IDF v5.5.5**，路径记为 `<esp-idf-root>`，未安装、升级或切换 IDF。
- 工程默认 `EASY_INPUT_BOARD=v2`，`sdkconfig.defaults` 固定 `CONFIG_IDF_TARGET="esp32s3"`，构建输出再次确认 `EasyInput board revision: v2` 和 `Building ESP-IDF components for target esp32s3`。未运行 `set-target`。
- 固件产物：`build/easy_input_keyboard.bin`，**`0x190800` / 1,640,448 字节**；ELF 为 `build/easy_input_keyboard.elf`，bootloader 为 `build/bootloader/bootloader.bin`。
- `partitions.csv` 中 factory App 分区为 `0x300000` / 3,145,728 字节；构建大小门实际输出剩余 **`0x16f800` / 1,505,280 字节（48%）**。
- 本轮构建输出明确重新编译 Host Action 相关文件：`components/keyboard/src/host_action_protocol.cpp`、`config_payload.cpp`、`config_state.cpp`、`config_status.cpp`、`keymap.cpp`、`main/app_main.cpp`、`main/platform/usb_hid.cpp` 和 `main/platform/ble_hid.cpp`；随后链接 ELF 并生成 bin 成功。

## warning、修复与禁止范围审计

- 成功构建的实际 stdout/stderr 中无 `warning:` 或编译／链接 `error:`。两条信息级提示为 IDF 自带 `esp_blockdev` 目录无 CMakeLists 而不加入、ESP-TEE 仅支持其他 SoC，不影响本项目。
- 板型静态扫描为 1 PASS / 2 WARN / 0 FAIL；两个 WARN 是扫描器没有获得条件编译选择，因而不能静态确认引脚声明。实际 CMake 和编译已选择 `v2/esp32s3`，扫描无 FAIL。
- 本轮唯一非 `flow/` 修复是 `host_test/CMakeLists.txt` 的一行注册和新增 `host_test/host_action_key_bindings_tests.cpp`；没有修改生产代码。固定示例 UUID 仅出现在宿主测试和 `flow/` 证据中。
- 操作前已存在 T06 的 `main/app_main.cpp`、`main/platform/usb_hid.*`、`main/platform/ble_hid.*` 差异；本轮没有再修改它们。
- `git diff --name-only` 不包含 `partitions.csv`、`sdkconfig*`、板级 pin/GPIO 定义、HID 描述符或 GATT 文件；`git diff --check` 通过。
- 本轮没有修改 Report ID `0x11`、kind `0x04/0x05`、63 字节容器或 36 字节 UUID 数据合同；没有修改设备身份、GPIO、BOOT、GPIO8 共享电源、Flash 分区、HID 描述符或 BLE GATT。
- 没有调用 `identify-device.sh`、串口、`flash`、`erase-flash` 或 App；ESP-IDF 环境体检仅返回端口计数元数据，未连接或识别任何设备。

## 实际修改文件

- 宿主测试：`host_test/CMakeLists.txt`、`host_test/host_action_key_bindings_tests.cpp`。
- 项目记录：`flow/plan.md`、`flow/进展.md`、本任务卡。
- 构建产物位于被 Git 忽略的 `build/`，不计入源码差异。

## 证据结论与仍未验证项

- **宿主测试通过只证明代码逻辑在宿主环境下通过。**
- **ESP-IDF 构建通过只证明当前 `v2/esp32s3` 可生成固件镜像。**
- **尚未烧录，Host Action 的 USB／BLE 真实发送、EasyInput 0.1.33 接收与 UUID 本机映射、真机按键、能力状态真实发布、电源／音频／设备身份行为都仍未验证。**
