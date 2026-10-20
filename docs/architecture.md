# 系统架构

## 两条相互关联但独立的路径

### 赛博塔罗交互路径

```text
EasyInput V2.0
  ├─ 普通按键 / 旋钮：USB 或 BLE HID 键盘事件
  ├─ 固定文字：写入当前系统输入焦点
  └─ 语音输入：由 EasyInput App / 操作系统完成转写
            ↓
操作系统当前窗口与输入焦点
            ↓
赛博塔罗网页的统一动作入口 performAction(...)
            ↓
牌局、学习、历史与周期洞察
```

网页无法也不会直接读取 GPIO、Flash、BOOT 状态或设备身份。它只处理浏览器能够收到的键盘事件和文字输入，因此普通键盘、鼠标和触控也可以完成全部主流程。

### Host Action v1 课程路径

```text
实体按键
→ Keymap 配置
→ press-only Host Action 事件
→ 共享 63 字节 App Command 编码
→ USB 优先或 BLE 单通道路由
→ EasyInput App 本机 UUID 映射
→ 操作系统打开目标应用
```

这条路径来自第 2 课复刻案例，用来学习如何把配置、纯逻辑、协议、传输、App 回执和真实操作分层验证。赛博塔罗当前主要使用键盘、固定文字和语音能力，不依赖 Host Action v1 才能运行。

## 四层职责

| 层级 | 负责什么 | 不负责什么 |
|---|---|---|
| 固件 | 扫描按键与旋钮、生成 HID/协议事件、选择 USB/BLE 通道 | 不保存网页牌局和模型密钥 |
| EasyInput App | 配置按键、建立本机应用映射、提供系统语音输入 | 不决定网页业务状态 |
| 操作系统 | 将键盘事件和转写文字送到当前窗口 | 不理解塔罗业务 |
| 网页 | 解释 S1–S8、管理牌局、历史、学习和洞察 | 不直接访问 GPIO 或烧录固件 |

## 数据与隐私

- 当前牌局使用 `sessionStorage`，关闭标签页后不作为长期记录。
- 长期历史与周期洞察使用浏览器 IndexedDB。
- 导出和恢复由用户主动触发，不自动上传。
- 默认 mock provider 完全在本地工作。
- 真实百炼调用只能通过 `server.mjs`，密钥只允许存在于未提交的服务端环境变量。

## 部署边界

- `dist/` 可以部署到 ChatGPT Sites 或 GitHub Pages。
- GitHub Pages 只支持静态 mock 体验。
- `server.mjs` 需要 Node.js 运行环境，不能由 GitHub Pages 承载。
- `case-studies/easyinput-host-action-v1/` 是源码与学习资料，不进入网站部署包。
