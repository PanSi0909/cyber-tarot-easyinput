# T13 · Host Action v1 正常模式连接与 App 入口预检

- **背景**：T12 已达到写入与恢复完成门，但 `POST_FLASH_READY=UNKNOWN`、`FUNCTION_VERIFIED=NO`。
- **目标**：在不复位、不烧录、不访问下载模式的前提下建立正常模式连接证据，并检查固定 App 版本、单实例、动作入口和设置通道门禁。
- **允许范围**：只读查看 Maker flow、EasyInput UI、已安装包元数据与运行进程；由用户在 App 中建立真实应用映射、同步配置并逐项观察真机功能；只记录脱敏证据。
- **禁止范围**：不运行 esptool、identify-device 或串口验身；不修改固件或 App 源码；不结束进程、不自动更新；不手写或公开记录 UUID；不再次烧录、复位或按 BOOT。
- **状态**：用户已授权将本节点固定 App 版本改为官网 EasyInput 0.1.33；正常模式连接、入口、配置同步和七项真机功能矩阵全部通过，节点完成。

## 前置状态

从 T12 读取并确认：

| 状态 | 输入 |
|---|---|
| `DEVICE_CONFIRMED` | YES |
| `FLASH_WRITTEN` | YES |
| `NORMAL_POWER_CYCLE_CONFIRMED` | YES |
| `POST_FLASH_READY` | UNKNOWN，可继续正常模式连接预检 |
| `FUNCTION_VERIFIED` | NO |

本节点保持开发板正常开机，全程未按 BOOT；没有再次烧录、复位、运行 esptool、identify-device 或 fresh 串口扫描。

## 正常模式连接证据

EasyInput 键盘页实际显示：

- 设备：`EasyInput AI`；
- 当前通道：`USB 连接`；
- 键盘输入状态：`键盘输入已连接`；
- 键盘设置状态：`设置可用`。

App 路径已提供正常模式连接证据，因此将 `POST_FLASH_READY` 更新为 YES。没有保存完整序列号、MAC 或 USB 拓扑。本节点未再独立执行操作系统 HID 枚举；BLE 后续在 BLE-only 与双连接矩阵中由用户实际确认。

## App 版本与实例预检

原任务固定要求为官网安装的 EasyInput 0.1.26。用户随后明确授权：本次 App 固定版本改为官网 EasyInput 0.1.33，并继续入口、同步和真机功能验证。仍要求只能运行一个非开发实例。按新授权重新判定的实际证据：

| 检查项 | 实际观察 | 结果 |
|---|---|---|
| 安装包位置 | 系统 Applications 下的官网安装包；项目记录不保存本机绝对路径 | PASS |
| 安装包元数据 | `CFBundleShortVersionString=0.1.33`、`CFBundleVersion=0.1.33` | PASS |
| 实际进程 | 仅一个官网安装包进程 | PASS |
| 开发实例 | 未发现 `target/debug` 或其他开发调试实例 | PASS |
| 用户可见版本 | About 窗口显示 `EasyInput Version 0.1.33 (0.1.33)` | PASS |

版本合同变更只适用于本次正常模式 App 验证，不修改固件协议、生产代码或电脑端源码。

## 动作入口与设置通道复核

- App 仍显示 `EasyInput AI`、`USB 连接`、`键盘输入已连接`、`设置可用`。
- 实体 KEY2 的“按下动作”下拉列表已只读展开，实际选项包含 `打开应用`；随后用 Escape 关闭列表，没有选择动作或目标应用。
- 当前界面仍为 `待同步`／`有修改待同步`；此状态不是配置确认成功证据。

## 配置同步确认

用户在官网 EasyInput 0.1.33 中将 KEY2 的“按下动作”设为“打开应用”，并由 App 本地选择 Calculator 后执行一次同步。项目记录不保存真实 UUID。

同步返回后的只读界面证据：

- 系统同步结果：`已确认`；
- 设备设置状态：`与上次同步一致`；
- KEY2：`打开应用`，目标显示为 `Calculator`；
- 设备配置状态：`已确认`；
- 明确提示：`EasyInput AI 已同步到键盘。`；
- 操作按钮已由“同步到键盘”变为“重新同步”；
- 当前内容空间显示 `1170/2048 字节`。

这些状态共同证明 App 已完成本次保存回执匹配，而不是停留在“已发送”“正在确认”或“等待键盘确认”。本轮没有重复点击同步，也不公开记录 bytes、crc16 或 UUID 的具体值。`CONFIG_SYNC_CONFIRMED=YES`。

## 隐私与证据边界

- 已由 App 本地建立真实应用映射并完成配置确认；没有手写或复用宿主测试 UUID。
- 界面已确认保存回执闭环；未抓取或保存 kind `0x03` 的原始 bytes/crc16，也未抓取 kind `0x04`／`0x05` 原始消息。
- 没有替用户退出进程、安装或更新 App，也没有把问题转成 App 端开发。
- 未保存完整序列号、MAC、USB 拓扑、真实 UUID 或 App 本地映射文件；目标应用只记录公开名称 Calculator。
- 没有抓取原始 HID／BLE 报文；真机结果来自 App 状态与用户逐项肉眼观察，因此不声称完成报文级抓包验证。

## 当前状态

| 状态 | 结果 |
|---|---|
| `POST_FLASH_READY` | YES |
| `CONFIG_SYNC_CONFIRMED` | YES |
| `FUNCTION_VERIFIED` | YES |

完成条件已满足：同步明确确认且七项矩阵逐项通过。

## 真机功能矩阵

| 项目 | 用户实际条件与观察 | 结果 |
|---|---|---|
| USB-only 能触发目标动作 | BLE 已按测试要求断开，保持 USB；用户退出 Calculator 后短按并松开 KEY2 一次，观察到 Calculator 打开、触发 1 次 | PASS |
| BLE-only 能触发目标动作 | USB 数据线已拔除，开发板保持正常开机；用户报告 App 显示 EasyInput AI 已连接，退出 Calculator 后短按并松开 KEY2 一次，观察到 Calculator 打开、触发 1 次 | PASS |
| USB／BLE 双连接按一次只执行一次 | 用户在 macOS 蓝牙设置确认 EasyInput BLE 为已连接，同时 USB 已连接；App 显示 USB 活动通道。短按 KEY2 一次，用户观察总触发 1 次 | PASS |
| 一次按下只触发一次 | 独立重测：用户完全退出 Calculator 后对 KEY2 清晰短按并松开一次，观察到按 1 次、触发 1 次 | PASS |
| 松开不重复 | 用户澄清实际按了 3 次，因此按下共触发 3 次；保持期间新增 0 次、每次松开后新增 0 次。没有把三次物理按下误记为一次按下三发 | PASS |
| 复制／粘贴／快捷键／固定文字仍正常 | TextEdit 独立观察：KEY6 复制通过、KEY7 粘贴通过、KEY5 全选快捷键通过；KEY8 临时设为固定文字并获明确同步确认，短按一次正确输入一次 `EasyInput-fixed-text`。随后 KEY8 恢复为“撤销”并再次获明确同步确认；KEY2 的 Calculator 映射仍保留 | PASS |
| EasyInput App 实际打开所选本机目标应用 | 独立于 USB-only 结果再次测试；用户完全退出 Calculator 后短按 KEY2，并确认实际打开的应用名称就是 Calculator | PASS |

用户随后明确澄清“三次触发”对应三次物理按下，不是一次按下三发，因此不存在需要继续定位的重复触发异常。

## 最终结论

- `POST_FLASH_READY=YES`
- `CONFIG_SYNC_CONFIRMED=YES`
- `FUNCTION_VERIFIED=YES`
- 官网 EasyInput 0.1.33 为唯一非开发实例；KEY2 保留 `打开应用 / Calculator`，KEY8 临时固定文字测试后已恢复为 `撤销` 并明确同步确认。
- 本节点没有再次烧录、复位、按 BOOT、运行 esptool／identify-device，也没有修改生产代码、宿主测试、构建配置、硬件配置或设备身份。
