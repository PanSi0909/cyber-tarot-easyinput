# T08 · Host Action v1 能力声明与 BLE 状态预算

- **背景**：App 需要从状态 JSON 发现能力，而 BLE 最终发布状态有 512 字节硬上限。
- **目标**：把唯一布尔能力值加入实际状态构造路径，并验证每个发布变体的最终 UTF-8 字节数。
- **输入**：T02 合同、T06 发送接入、现有完整／紧凑／诊断／battery／fallback 状态路径。
- **产出路径**：最小状态实现与宿主预算测试。
- **验收标准**：能力是布尔 `true`、只在 capabilities 中出现一次；`0x04`／`0x05` 职责不变；所有实际发布变体不超过 512 字节；不得提高上限或静默删除无关状态字段。
- **状态**：已完成（2026-08-28）；平台构建、App 和实板仍未验证。

## 操作前状态

- 当前分支为 `course/host-action-v1-starter`，基线提交为 `743368a`；工作区已保留 T03／T04／T06 的 Host Action 差异，本轮没有撤销或重写。
- `flow/` 没有另一张已运行的 T08 失败卡；`flow/decisions.md` 已保留经批准的两条预算修复规则。
- 候选预算修复已在当前 starter 中：`speaker_probe` 专用 firmware 内容上限已为 16，normal 仍为 40；normal／battery 都已有“先只省略四个 cycle 字段、保留 current power”的中间回退。因此本轮只补能力声明和精确宿主证据，不为制造差异重写预算逻辑。

## 实际修改文件

### 状态实现

- `components/keyboard/include/keyboard/config_status.h`
- `components/keyboard/src/config_status.cpp`

### 宿主测试

- `host_test/CMakeLists.txt`
- `host_test/config_status_tests.cpp`
- `host_test/firmware_source_contract_tests.cpp`
- `host_test/host_action_capability_status_tests.cpp`（新增）

### 项目记录

- `flow/plan.md`
- `flow/进展.md`
- 本任务卡

## 能力声明路径

- 完整状态：`build_full_status_json()` 在原 `semantic_actions`、`offline_platform_switch`、`config_max_bytes`、`usb_management_v1` 后追加固定布尔 `"host_action_v1":true`。
- 紧凑、确认、battery 和它们的所有回退变体：共用 `build_compact_status_json()` → `append_sync_core()`，因此只从一个 `capabilities` 对象产生一次布尔能力。
- speaker probe：`build_speaker_probe_status_json()` 的精简 `capabilities` 对象也追加同一布尔能力。
- BLE 超限 fallback：共享 `kConfigStatusFallbackJson` 中包含一次正确能力。
- BLE 最终发布：battery 继续使用 `append_ble_status_wire_json()`，其他状态继续使用 `append_ble_detailed_status_wire_json()`；两者只在最终 UTF-8 JSON 不超过 512 字节时追加 BLE 对象。这两条已有路径本轮未改动。

测试对每个变体确认：`"host_action_v1":true` 恰好一次、位于 `capabilities` 内，不存在字符串 `"true"` 或布尔 `false` 变体，也没有重复顶层字段；原有其他能力值按原快照逐字比较保持不变。

## 预算回归证据

### speaker probe

- `kFirmwareStringMaxLen = 40`，普通状态测试传入 40 字节并确认全部保留。
- 只有 `kSpeakerProbeFirmwareStringMaxLen = 16`；最坏样本传入 40 字节，最终 speaker probe 保留 16 字节 firmware。
- `spk` 中原有 `v/g/st/r/e/x` 和 `mg/fu/du/mu/n/p/sw/h0/h1/hl/hm/pk/rm` 全部指标、字段名、数值类型与 JSON 结构均逐项断言存在，没有删除。

### current power 与 recent power-cycle

- `carries_truthful_recent_deep_sleep_cycle_when_budget_allows()` 证明能容纳时同时保留 current power 的 `mode/inactive_ms/deep_sleep_block/last_wake` 和 recent cycle 的 `cycle_seq/cycle_inactive_ms/cycle_deep_sleep/cycle_wake`。
- `recent_cycle_overflow_keeps_current_power_and_omits_only_cycle()` 使用加入能力后能精确触发中间回退的样本，确认超限时 current power 四项仍全部存在，只省略四个 cycle 字段。
- battery 的普通和 32 位边界样本同样断言 current power 一直保留；只有可选 cycle、battery detail 和 compact speaker boot 证据按已批准顺序让出预算。

## 各实际 BLE 发布变体的最终 UTF-8 字节数

`host_action_capability_status_tests` 实际构造状态、调用对应 BLE 最终附加函数并输出：

| 发布变体 | 基础 JSON | 最终 BLE JSON | 512 上限剩余 |
|---|---:|---:|---:|
| full | 408 | 408 | 104 |
| compact | 483 | 483 | 29 |
| speaker_probe | 512 | 512 | 0 |
| confirmation | 444 | 444 | 68 |
| battery | 435 | 512 | 0 |
| BLE fallback | 241 | 241 | 271 |

最大最终值为 **512 字节**，上限 **512 字节**，剩余 **0 字节**。full、compact、speaker_probe、confirmation 和 fallback 的详细 BLE 片段若追加后超限，已有函数按合同返回未附加的有界状态，不提高上限。

## 失败到通过的测试证据

- 生产修改前定向 6 项中 3 项失败：`config_status_tests`、`firmware_source_contract_tests`、`host_action_capability_status_tests`都因能力缺失中止；`status_hid_protocol_tests`、`host_action_protocol_tests` 和原 BLE wire 测试继续通过。
- 加入能力后，运行时状态与字节预算已通过；源码合同两次因 C++ 字符串的反斜杠转义计数过严为 `5/6`，改为计数源码中的字段标识后解决，没有为此改生产逻辑。
- 最终定向命令：`ctest --test-dir <temporary-host-build-dir> -R '^(config_status_tests|host_action_capability_status_tests|ble_status_wire_tests|status_hid_protocol_tests|host_action_protocol_tests|firmware_source_contract_tests)$' --output-on-failure`，结果 `6/6` 通过、0 失败。
- 最终完整命令：`ctest --test-dir <temporary-host-build-dir> --output-on-failure`，结果 `59/59` 通过、0 失败。
- 字节审计命令：`<temporary-host-build-dir>/host_action_capability_status_tests`，输出与上表一致。

## 禁止范围与仍未验证项

- `status_hid_protocol_tests` 继续锁定状态 kind `0x04`；`host_action_protocol_tests` 继续锁定 Report ID `0x11`、Host Action kind `0x05`、63 字节容器和 36 字节数据。能力只在状态 JSON，没有进入 Host Action payload。
- 本轮未修改 `main/app_main.cpp`、`main/platform/usb_hid.*`、`main/platform/ble_hid.*` 或共享 Host Action 编码；操作前已存在的 T06 发送差异原样保留。
- 没有修改 HID 描述符、BLE GATT、设备身份、GPIO、BOOT、GPIO8 共享电源、电源控制、Flash 分区、512 字节上限或测试 UUID。`git diff --check` 通过。
- 未运行 ESP-IDF 构建，未识别设备或端口，未烧录，未读串口，未运行 EasyInput 0.1.33，未做 App／USB／BLE GATT／Host Action 真机验证。
