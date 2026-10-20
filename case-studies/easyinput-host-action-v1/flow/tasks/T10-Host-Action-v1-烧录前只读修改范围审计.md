# T10 · Host Action v1 烧录前只读修改范围审计

- **背景**：烧录前必须证明课程改动没有越过硬件、身份、分区、协议、隐私和公开提交边界。
- **目标**：以课程起点标签到当前工作区的全部 staged、unstaged、untracked 和全仓 ignored 状态为对象，逐文件读取差异并归类。
- **输入**：当前生效的 `AGENTS.md`、T02 冻结合同、T09 软件侧总验收、EasyInput V2.0 硬件事实、Git 基线和完整工作区状态。
- **允许范围**：只读仓库；结束时只在 `flow/` 写入本审计与交接。
- **禁止范围**：不修改生产代码、配置或测试；不访问设备、串口或 App；不烧录；不删除、回退或覆盖既有改动。
- **状态**：初审完成（2026-08-29）时为 `NO`；完成获准脱敏后的最新复审为 `SAFE_TO_REQUEST_FLASH = YES`，见文末增量。

## 结论

`SAFE_TO_REQUEST_FLASH = NO`

硬件、分区、有效构建配置、设备身份、Host Action v1、隐私日志和无关功能范围均为 PASS；但受版本控制的既有 `flow/` 差异包含本机绝对路径，违反 `AGENTS.md` 的公开提交边界，也不满足“本机路径没有混入源码提交范围”的验收条件。本节点不获准清理这些旧记录，因此保留现场并停止，不请求烧录。

精确风险位置：

- `flow/tasks/T06-Host-Action-v1-Vendor-HID-发送接入.md` 第 31、33、34 行包含临时构建绝对路径。
- `flow/tasks/T08-Host-Action-v1-能力声明与BLE状态预算.md` 第 79—81 行包含临时构建绝对路径。
- `flow/tasks/T09-Host-Action-v1-软件侧总验收.md` 第 95—120、135 行包含临时目录、用户目录、工具安装目录和仓库绝对路径。

这些内容属于文档差异，不会改变当前固件二进制；但它们处于受跟踪的提交范围，足以使本次严格审计失败。为避免继续扩散，本记录只给文件与行号，不复制具体本机路径。

## 基线、数量与证据边界

- 当前分支：`course/host-action-v1-starter`；当前 HEAD：`743368ac86b8fd2a2ff9512d172d32b7baf300db`。
- 课程起点标签：`course-host-action-v1-start-v1`，提交 `a408ed43b6ce504c60d7bf9c92003cee3f4efb3b`。
- `git diff --quiet course-host-action-v1-start-v1 HEAD` 退出 0，证明标签与当前 HEAD 的文件树一致；课程起点可作为可靠内容基线。
- T02 的操作前记录证明，当时唯一既有差异是 T01。因此 T01 单独归为课程开始前已有改动，其余 Host Action 差异按后续节点归属。
- 写入本审计前：staged 0、unstaged 28、untracked 5；`git status --short --ignored` 返回 ignored 顶层条目 3 个。
- 本节点没有重新运行宿主测试或构建。T09 的 `60/60` 和能力状态最大 `512/512` 只作为已记录证据，不冒充本轮执行结果。

## 上一节点测试清单核对

- 课程起点：57 项。
- Host Action 新增专名测试：`host_action_protocol_tests`、`host_action_capability_status_tests`、`host_action_key_bindings_tests`，共 3 项。
- T09 最终实际发现 60、执行 60、通过 60、失败 0，数量闭合。
- T09 完整清单：

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

当前仓库内的 `build-host/` 是较早的 58 项本机构建缓存，不是 T09 的 60 项验收目录，不能替代上述 T09 记录。

## 全部版本控制变化分类

所有 28 个已跟踪文件都读取了实际 diff；所有 5 个未跟踪文件都读取了内容。`git diff --numstat` 没有二进制条目，5 个未跟踪文件均识别为 ASCII C/C++ 源文件。

| 状态 | 文件 | 分类与实际内容 |
|---|---|---|
| M | `components/keyboard/CMakeLists.txt` | Host Action 生产实现；注册共享协议源码 |
| M | `components/keyboard/include/keyboard/config_status.h` | Host Action 生产实现；能力状态构造接口 |
| M | `components/keyboard/include/keyboard/keymap.h` | Host Action 生产实现；动作与事件类型 |
| M | `components/keyboard/src/config_payload.cpp` | Host Action 生产实现；完整前缀配置解析与严格校验入口 |
| M | `components/keyboard/src/config_status.cpp` | Host Action 生产实现；布尔能力及 512 字节状态回退兼容 |
| M | `components/keyboard/src/keymap.cpp` | Host Action 生产实现；press 事件、release 无事件 |
| ?? | `components/keyboard/include/keyboard/host_action_protocol.h` | Host Action 生产实现；唯一共享常量和编码接口 |
| ?? | `components/keyboard/src/host_action_protocol.cpp` | Host Action 生产实现；规范 UUID 校验和共享 payload 编码 |
| M | `main/app_main.cpp` | Host Action 生产实现；事件分发并保留 USB 优先、失败不跨通道补发 |
| M | `main/platform/ble_hid.cpp` | Host Action 生产实现；BLE 复用共享编码结果 |
| M | `main/platform/ble_hid.h` | Host Action 生产实现；BLE 适配接口 |
| M | `main/platform/usb_hid.cpp` | Host Action 生产实现；USB 复用共享编码结果与既有队列 |
| M | `main/platform/usb_hid.h` | Host Action 生产实现；USB 适配接口 |
| M | `host_test/CMakeLists.txt` | 宿主测试；注册三个 Host Action 专名测试 |
| M | `host_test/config_payload_tests.cpp` | 宿主测试；合法/非法 UUID 与 KEY1—KEY8 配置覆盖 |
| M | `host_test/config_state_tests.cpp` | 宿主测试；无效配置 fail closed |
| M | `host_test/config_status_tests.cpp` | 宿主测试；能力布尔值与状态回退 |
| M | `host_test/firmware_source_contract_tests.cpp` | 宿主测试；源码级共享编码、分发、身份与状态合同守卫 |
| M | `host_test/keymap_tests.cpp` | 宿主测试；press 一次、release 无动作 |
| M | `host_test/transport_routing_tests.cpp` | 宿主测试；USB 优先单通道语义 |
| ?? | `host_test/host_action_capability_status_tests.cpp` | 宿主测试；实际发布状态变体和 512 字节上限 |
| ?? | `host_test/host_action_key_bindings_tests.cpp` | 宿主测试；KEY1—KEY8 独立专名覆盖 |
| ?? | `host_test/host_action_protocol_tests.cpp` | 宿主测试；固定 payload 字节合同 |
| M | `flow/decisions.md` | `project-flow-cy` 记录；冻结协议决策 |
| M | `flow/plan.md` | `project-flow-cy` 记录；课程节点进度 |
| M | `flow/tasks/T01-工程结构与板型只读核对.md` | 课程开始前已有改动；T02 已记录为当时唯一既有差异 |
| M | `flow/tasks/T02-Host-Action-v1-固定兼容协议.md` | `project-flow-cy` 记录；冻结合同 |
| M | `flow/tasks/T03-Host-Action-v1-纯逻辑实现.md` | `project-flow-cy` 记录；纯逻辑交接 |
| M | `flow/tasks/T04-Host-Action-v1-八键配置覆盖.md` | `project-flow-cy` 记录；八键交接 |
| M | `flow/tasks/T06-Host-Action-v1-Vendor-HID-发送接入.md` | `project-flow-cy` 记录；发送交接；同时含违反公开边界的绝对路径 |
| M | `flow/tasks/T08-Host-Action-v1-能力声明与BLE状态预算.md` | `project-flow-cy` 记录；能力交接；同时含违反公开边界的绝对路径 |
| M | `flow/tasks/T09-Host-Action-v1-软件侧总验收.md` | `project-flow-cy` 记录；软件总验收；同时含违反公开边界的绝对路径 |
| M | `flow/进展.md` | `project-flow-cy` 记录；节点交接索引 |

未发现无法解释的代码或测试文件，也没有无关生产实现；失败项是三份流程记录的公开路径卫生，而不是未知归属。

## 全仓 ignored 顶层条目分类

审计使用未带路径限定的 `git status --short --ignored`，完整返回三个 ignored 顶层条目；没有只查询预设目录。

| 顶层条目 | 忽略规则 | 来源／用途 | 构建或烧录参与 | 提交风险与依据 | 结论 |
|---|---|---|---|---|---|
| `build-host/` | `.gitignore:12 build-host/` | 本机 CMake/CTest 宿主构建产物，约 48 MiB；当前缓存登记 58 项测试，早于 T09 的全新 60 项目录 | 仅显式使用该目录时参与宿主测试；不参与固件烧录 | `git ls-files` 无条目；顶层被忽略，不应提交 | PASS |
| `build/` | `.gitignore:10 build/` | ESP-IDF 固件构建产物，约 215 MiB；含 ELF、bin、map、日志、CMake 缓存和有效 `build/sdkconfig` | 参与后续明确授权的烧录；当前 bin 为 T09 记录的 1,640,448 字节产物 | 顶层被忽略且无跟踪文件；二进制和本机路径只在被忽略的生成元数据中，不会自动进入提交 | PASS |
| `managed_components/` | `.gitignore:13 managed_components/` | IDF Component Manager 下载的托管依赖，约 22 MiB | 参与编译/链接，不是烧录输入本身 | 顶层被忽略且无跟踪文件；应由受跟踪 lock 重建，不提交目录 | PASS |

### 托管依赖逐项闭合

| 实际目录 | `.component_hash` | `dependencies.lock` | 结果 |
|---|---|---|---|
| `managed_components/espressif__esp_tinyusb/` | `6a50305bc61c7a361da8c0833642be824e92dacb0a6001719a832a4e96e471bf` | 同值；版本 `1.7.6~2` | PASS |
| `managed_components/espressif__tinyusb/` | `a72b7d67472914ab76309340fd50d578b31e310963d45ad0f81144bde3314752` | 同值；版本 `0.21.0~1` | PASS |

`dependencies.lock` 本身无 diff，锁定 target `esp32s3`、ESP-IDF `5.5.5`；实际目录数 2、hash 文件数 2、lock 中托管组件数 2，数量与值均闭合。

### sdkconfig、预览和缓存核对

- 源码根 `sdkconfig`、`sdkconfig.old` 均不存在；它们虽有忽略规则，但没有形成 ignored 顶层条目。
- 工程不是“没有有效配置”。`CMakeLists.txt` 默认板型为 `v2`，限定 target `esp32s3`，默认把 SDKCONFIG 放到构建目录并从受跟踪的 `sdkconfig.defaults` 派生。
- `build/CMakeCache.txt` 和 `build/project_description.json` 都指向实际 `build/sdkconfig` 与源码根 `sdkconfig.defaults`；`build/sdkconfig` 实际包含 `esp32s3`、16 MiB Flash 和自定义 `partitions.csv`。这是当前有效构建配置，但属于已分类的 ignored `build/`。
- `.cache/`、`cache/`、`preview/`、`previews/`、`.preview/`、`assets/readme/render/`、`assets/readme/page/` 均不存在。实际只发现 `build/CMakeCache.txt` 与 `build-host/CMakeCache.txt`，已经随对应构建目录分类；没有遗漏独立预览／缓存顶层条目。

## 禁止修改与冻结合同矩阵

| # | 核查项 | 结果 | 文件／diff 证据 |
|---|---|---|---|
| 1 | GPIO、`board_pins`、BOOT、GPIO8 共享电源控制未被本功能改变 | PASS | `board_pins.h` 与硬件安全文档相对 HEAD 无 diff；v2 仍为 KEY1—KEY8=`2,47,38,41,1,6,7,48`、BOOT=`0`、GPIO8 高有效，编码器/USB/麦克风/扬声器脚位均保持既有值 |
| 2 | 分区、Flash、有效 sdkconfig、target 和板型保持 `v2/esp32s3` 合同 | PASS | `CMakeLists.txt`、`sdkconfig.defaults`、`partitions.csv` 无 diff；有效 `build/sdkconfig` 为 esp32s3、16 MiB、自定义分区；factory App 仍为 `0x300000` |
| 3 | USB/BLE 身份、HID 描述符、GATT 标识与地址策略未修改 | PASS | USB/BLE 平台实际 diff 只增加 Host Action 适配；VID `0x303A`、PID `0x1006`、制造商 `AIOTWAN`、产品名 `EasyInput AI`、USB 序列 `easy-input-v2`、BLE 名称、Report ID `0x11` 描述符、GATT 与静态随机地址策略所在代码无差异 |
| 4 | Host Action v1 符合冻结合同 | PASS | 共享头固定 `0x11/0x05/63/36`；编码器零初始化 payload，写入 `[0]=0x05,[1]=0,[2]=1,[3]=36`，仅复制无前缀 UUID 到 `[4..39]`；状态仍为 `0x04`；USB/BLE 都调用共享编码；分发 USB epoch 存在即返回，失败也禁止 BLE 补发 |
| 5 | 固件不保存应用元数据；示例 UUID 仅限测试 | PASS | 生产差异中无应用路径、Bundle ID、应用名、图标或启动参数字段；固定示例 UUID 在排除 `host_test/`、`flow/` 和生成目录后零命中；默认 Keymap 无 Host Action 固定映射 |
| 6 | 没有新增隐私日志 | PASS | 生产 diff 只新增两条 `ACTION ... host_action` 类型日志，未输出 event value、UUID、应用信息、设备唯一标识或用户内容 |
| 7 | 复制、粘贴、快捷键、固定文字、音频、电源等无关功能没有不可解释改动 | PASS | 生产 diff 仅涉及 Host Action 和状态 512 字节兼容文件；音频、电源、GPIO、分区无 diff；T09 既有完整 60/60 记录包含相关回归，但本轮未重跑 |
| 8 | ignored 全量分类、依赖与 lock 一致，二进制和本机路径未混入提交范围 | FAIL | 三个 ignored 顶层条目均已闭合，托管依赖与 lock 一致，二进制均被忽略；但 T06、T08、T09 三份受跟踪流程记录含本机绝对路径 |

## 实际只读命令与退出结果

以下命令都在仓库根目录执行；为遵守公开边界，命令使用相对路径，未复制本机绝对路径：

```bash
git branch --show-current
git rev-parse HEAD
git rev-parse course-host-action-v1-start-v1
git diff --quiet course-host-action-v1-start-v1 HEAD            # exit 0
git status --short --ignored                                    # exit 0；无路径限定
git status --porcelain=v1                                       # exit 0
git diff --name-status HEAD -- .                                # exit 0
git diff --unified=0 HEAD -- <每个已跟踪变化文件>               # exit 0
sed -n ... <每个未跟踪文件>                                     # exit 0
git diff --numstat HEAD -- .                                    # exit 0；无二进制项
git check-ignore -v build/ build-host/ managed_components/       # exit 0
git ls-files build build-host managed_components                # exit 0；无输出
find managed_components -mindepth 1 -maxdepth 2 ...              # exit 0
git diff --quiet HEAD -- dependencies.lock                       # exit 0
git diff --quiet HEAD -- CMakeLists.txt sdkconfig.defaults partitions.csv # exit 0
git diff --quiet HEAD -- components/keyboard/include/keyboard/board_pins.h docs/hardware/easyinput-v2-safety.md partitions.csv sdkconfig.defaults CMakeLists.txt # exit 0
rg ... dependencies.lock build/CMakeCache.txt build/project_description.json build/sdkconfig
rg ... <身份、协议、固定 UUID、应用映射和日志审计范围>
git diff --check                                                 # exit 0
```

本节点没有执行 CMake、CTest、`idf.py`、设备识别、串口、App 或烧录命令。

## 仍未知项与停止原因

- Git、flow、构建元数据和 lock 的范围已闭合，没有构建/烧录影响项被标为 UNKNOWN。
- 真机 USB/BLE 收包、EasyInput 0.1.33 接收、UUID 到本机应用映射、实际按键、状态发布、电源与音频行为仍未验证；这是按授权保留的真机验证缺口，不是本审计的 PASS 证据。
- 停止原因是受跟踪流程记录中的本机绝对路径。必须在另一个明确授权的修复节点中脱敏并重新审计，才可重新判断是否能请求烧录。

## 2026-08-29 · 获准脱敏后的最新复审增量

> 本节是本任务卡的最新结论；上方 `NO` 保留为脱敏前的历史快照，不再代表当前状态。

- 经用户明确授权，只将 T06、T08、T09 中的本机绝对路径替换为公开占位符或仓库相对路径；没有修改生产代码、测试、构建配置、硬件配置或设备身份。
- 脱敏后扫描整个 `flow/` 和当前新增 Git diff，本机绝对路径均为零命中；`git diff --check` 退出 0。
- 全仓状态数量保持 staged 0、unstaged 29、untracked 5、ignored 顶层 3；没有新增状态条目，三个 ignored 顶层仍为 `build-host/`、`build/`、`managed_components/`。
- 重新核对 GPIO、BOOT、GPIO8、分区、有效 sdkconfig、`v2/esp32s3`、USB/BLE 身份、HID/GATT、Host Action v1、隐私日志、托管依赖与 lock，全部 PASS。
- 烧录任务开始前再次核对：审计后没有新增非 `flow/` 变化；ESP-IDF 仍为 5.5.5；应用 ELF 和二进制生成目标的 Ninja dry-run 均为 `no work to do`；应用镜像为 `build/easy_input_keyboard.bin`、1,640,448 字节，镜像 checksum 与 validation hash 有效。

最新结论：`SAFE_TO_REQUEST_FLASH = YES`。这只允许进入只读设备验身和人工写入确认，不表示已授权或完成烧录。
