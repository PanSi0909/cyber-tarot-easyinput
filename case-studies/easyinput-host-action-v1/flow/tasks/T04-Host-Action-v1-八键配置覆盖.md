# T04 · Host Action v1 八键配置覆盖

- **背景**：八个实体主按键应复用同一配置解析链路，不能复制八套实现。
- **目标**：补参数化宿主测试，逐项证明 KEY1—KEY8 都能保存完整配置值，并产生正确的按下／松开事件。
- **输入**：T02 固定合同、T03 纯逻辑实现、现有八键配置循环。
- **产出路径**：`host_test/config_payload_tests.cpp`；本节点未修改生产逻辑。
- **验收标准**：八键逐项通过；每次 press 恰好一个事件，release 无事件；复制、粘贴、快捷键和固定文字回归；示例 UUID 只存在宿主测试。
- **状态**：2026-08-28 已完成；定向 `3/3` 和完整宿主测试 `58/58` 通过。

## 通用解析链路核对

- `components/keyboard/src/config_payload.cpp` 以一个包含 KEY1—KEY8 的表驱动循环，每项都调用同一 `parse_binding()`。
- 因此现有生产能力已经共用通用配置解析；本节点只补参数化宿主证据，没有为制造改动而重写架构。
- 板级边界核对：EasyInput V2.0 的 S1—S8 是八路独立主按键，对应项目中的 KEY1—KEY8；本节点不修改任何 GPIO 或电气语义。

## KEY1—KEY8 逐项证据

| 实体主键 | 配置解析 | Keymap 保留前缀 | press | release |
|---|---|---|---|---|
| KEY1 | `Ok` | 完整 Host Action | `HostAction` 一次 | `None` |
| KEY2 | `Ok` | 完整 Host Action | `HostAction` 一次 | `None` |
| KEY3 | `Ok` | 完整 Host Action | `HostAction` 一次 | `None` |
| KEY4 | `Ok` | 完整 Host Action | `HostAction` 一次 | `None` |
| KEY5 | `Ok` | 完整 Host Action | `HostAction` 一次 | `None` |
| KEY6 | `Ok` | 完整 Host Action | `HostAction` 一次 | `None` |
| KEY7 | `Ok` | 完整 Host Action | `HostAction` 一次 | `None` |
| KEY8 | `Ok` | 完整 Host Action | `HostAction` 一次 | `None` |

参数化测试每轮只把固定测试 Host Action 放到一个目标键，其他七键为 `disabled`，依次覆盖全部八键。

## 旧动作兼容证据

- 复制：默认 Keymap 和平台语义回归仍验证 `Copy` 及 macOS/Windows 快捷键。
- 粘贴：默认 Keymap 和平台语义回归仍验证 `Paste` 及 macOS/Windows 快捷键。
- 自定义快捷键：配置解析仍保留 `Hotkey`，Keymap 仍生成按下和松开 HID 事件。
- 固定文字：配置解析、960 字节上限、UTF-8 和 press-only 事件回归仍通过。

## 测试与范围证据

```bash
cmake --build build-host --target config_payload_tests keymap_tests host_action_protocol_tests -j2
ctest --test-dir build-host --output-on-failure -R '^(config_payload_tests|keymap_tests|host_action_protocol_tests)$'
cmake --build build-host -j2
ctest --test-dir build-host --output-on-failure
```

- 定向测试：`3/3` 通过。
- 完整宿主测试：`58/58` 通过。
- 全仓固定字符串扫描只在 `host_test/config_payload_tests.cpp` 命中示例 UUID，生产代码、默认 Keymap、生产配置和 `flow/` 均无该示例。
- `git diff` 对 `main/app_main.cpp`、`main/platform/`、能力状态、GPIO／BOOT／电源／分区路径的受保护范围统计为 `0` 个文件。
- 未验证：USB／BLE 适配和真实发送（T06），`"host_action_v1": true` 与 BLE 512 字节预算（T08），ESP-IDF 5.5.5 默认构建（T09），NVS Host Action 真实持久化，烧录与实板行为。
