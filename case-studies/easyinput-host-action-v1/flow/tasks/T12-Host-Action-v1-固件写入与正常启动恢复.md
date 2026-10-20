# T12 · Host Action v1 固件写入与正常启动恢复

- **背景**：T09 已完成软件侧总验收，T10 脱敏复审最新结论为 `SAFE_TO_REQUEST_FLASH = YES`。
- **目标**：只读验明唯一目标设备，经人工精确确认后写入完整工程固件，并恢复正常启动。
- **允许范围**：只读审计、唯一设备验身、经确认后的正常 `idf.py flash`、正常断电重启、一次操作系统 USB/HID 枚举和脱敏 flow 交接。
- **禁止范围**：不整片擦除；不修改源码、测试、配置、GPIO、BOOT、GPIO8、分区、HID/GATT、USB/BLE 身份或 App 映射；不运行 Host Action 功能矩阵。
- **状态**：写入与正常启动恢复完成；`POST_FLASH_READY = UNKNOWN`，真实功能未验证。

## 审计连续性与产物门

- 最新 T10 结论为 `SAFE_TO_REQUEST_FLASH = YES`；审计后没有新增非 `flow/` 差异。
- 项目锁定 ESP-IDF 5.5.5、板型 `v2`、target `esp32s3`、16 MiB Flash 和既有 `partitions.csv` 均保持一致；没有升级环境、运行 `set-target` 或改动 sdkconfig／分区。
- 在锁定环境中，应用 ELF 与二进制生成目标的 Ninja dry-run 均返回 `no work to do`；没有固件输入晚于应用镜像。
- 应用镜像为 `build/easy_input_keyboard.bin`，大小 1,640,448 字节；镜像 checksum 与 validation hash 有效。

## 只读验身与人工授权

- 初次端口扫描为 0；系统 USB 枚举也未见预期正常模式设备。用户按当前板唯一正确规则，在开机状态短按并松开一次 BOOT。
- fresh 重扫后只有一个候选端口；只读识别为 ESP32-S3，MAC 仅记录后四位 `DA68`。完整 MAC 只在当前对话的授权卡中临时显示，未写入项目。
- 授权卡明确列出芯片、工程 target、IDF 版本、三段写入范围、应用镜像和显式端口命令；用户原样输入由 MAC 后四位生成的唯一确认句。
- 真正写入前再次 fresh 扫描并重验，同一 ESP32-S3、同一 MAC 尾号 `DA68`，无多设备歧义。

## 写入范围、命令与结果

经确认的完整工程写入范围：

| 偏移 | 文件 | 结果 |
|---|---|---|
| `0x0` | `build/bootloader/bootloader.bin`，20,832 字节 | 写入并通过 Hash 校验 |
| `0x8000` | `build/partition_table/partition-table.bin`，3,072 字节 | 写入并通过 Hash 校验 |
| `0x10000` | `build/easy_input_keyboard.bin`，1,640,448 字节 | 写入并通过 Hash 校验 |

脱敏后的实际命令：

```bash
source <esp-idf-root>/export.sh >/dev/null 2>&1 && \
idf.py -C . -p <confirmed-port> flash
# exit 0
```

- 实际使用 ESP-IDF 5.5.5 和显式确认端口，esptool 识别 ESP32-S3 后一次完成三段写入。
- 没有执行 `erase_flash`，没有改写工程偏移、Flash 分区或设备身份。
- App 分区仍为 `0x300000`；应用镜像 `0x190800`，剩余 `0x16f800`（48%）。

## BOOT、session 与恢复历史

- 下载模式进入方式记为 `manual`：只在首次验身前由用户保持开机、短按并松开一次 BOOT。
- 烧录工具的自动连接第一次即成功；没有在失败后再次要求 BOOT，也没有按住 BOOT、配合上电或使用不存在的 RESET。
- 烧录退出 0 后工具执行自动 hard reset；fresh 扫描仍见已确认下载端口，因此立即运行 post-flash `prepare`。
- `prepare` 对 ESP32-S3 与 MAC 尾号 `DA68` 再次匹配，session 已建立；项目记录只保留“已建立”，不保存 session token。
- 用户随后用板上电源开关完全关机，再不按 BOOT 正常开机；用户已明确确认该完整电源循环。开发板带电池，因此没有把只拔 USB 当成断电。
- 正常开机后没有再次运行 identify-device、esptool、串口控制复位或任何写入命令。

## 正常模式只读观察与证据边界

- 工程事实：Maker 正常应用 USB 描述符只有 HID，VID/PID 为 `0x303A/0x1006`，产品名为 `EasyInput AI`，没有 CDC 串口。因此恢复后没有串口既不能证明失败，也不能证明成功。
- 正常重启后只执行一次不写设备的操作系统 USB 枚举，并且只筛选预期产品名与 VID/PID；本次没有观察到匹配项。
- 没有保存完整 USB 序列号或拓扑，也没有为制造通过而增加日志、重置设备或再次烧录。
- 结论为 `POST_FLASH_READY = UNKNOWN`，不是烧录失败。下一节点必须先建立 EasyInput App、USB HID 或 BLE 的正常模式连接证据。

## 最终状态

| 状态 | 结果 |
|---|---|
| `DEVICE_CONFIRMED` | YES |
| `FLASH_WRITTEN` | YES |
| `NORMAL_POWER_CYCLE_CONFIRMED` | YES |
| `POST_FLASH_READY` | UNKNOWN |
| `FUNCTION_VERIFIED` | NO |

前三项为 YES，达到本节点“写入与恢复”完成门，可以进入正常模式与真实功能验证；当前不能声称 Host Action 或其他真机功能成功。
