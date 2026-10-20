# Cyber Tarot × EasyInput

一个由 EasyInput V2.0 八键、旋钮和语音输入驱动的赛博塔罗网页，也是一次从 AI 硬件协议实践走向完整交互产品的课程项目。

[正式站点](https://cyber-tarot-between-signals.a0921093504.chatgpt.site/) · [GitHub Pages 零成本演示](https://pansi0909.github.io/cyber-tarot-easyinput/) · [新手实操](docs/getting-started.md) · [资料中心](docs/README.md)

![赛博塔罗项目视觉](dist/card-art.png)

## 第一次来到这里

你不需要先懂硬件、塔罗或 AI 接口。按目标选择入口：

| 我想…… | 从这里开始 |
|---|---|
| 先体验作品，不安装任何东西 | [打开 GitHub Pages](https://pansi0909.github.io/cyber-tarot-easyinput/) |
| 跟着步骤在本地运行 | [新手实操指南](docs/getting-started.md) |
| 理解硬件、App、系统和网页 | [系统架构](docs/architecture.md) |
| 阅读第 2–8 课真实开发过程 | [课程学习路线](docs/learning-guide.md) |
| 查找全部资料和证据 | [资料中心](docs/README.md) |
| 深入固件与 Host Action | [第 2 课复刻案例](case-studies/easyinput-host-action-v1/README.md) |

没有 EasyInput 开发板也能完成全部网页主流程；硬件路线是可选进阶。

## 这个仓库包含什么

仓库由两个彼此关联、但可以独立理解的部分组成：

1. **赛博塔罗网站**：78 张原创牌面、四种牌阵、结构化解读、历史备份、学习模式和周期洞察。
2. **EasyInput Host Action v1 复刻案例**：基于官方课程起点完成的固件实现、宿主测试、构建记录与真机验证。

二者不是源码依赖关系：网页使用操作系统收到的键盘、固定文字和语音输入；即使没有开发板，也可以用鼠标和普通键盘完整体验。Host Action v1 是第 2 课的独立 AI 硬件实践案例，不是网页运行所必需的固件。

```text
EasyInput 硬件与按键配置
→ 操作系统键盘、固定文字和语音输入
→ 赛博塔罗网页

Host Action v1 复刻
→ 独立的第 2 课 AI 硬件开发案例
→ 不属于赛博塔罗网页的运行时依赖
```

## 主要能力

| 输入 | 默认职责 |
|---|---|
| S1 | 开始新一轮 |
| S2 | 选择牌阵 |
| S3 | 语音输入问题、追问或学习笔记 |
| S4 | 生成综合解读 |
| S5 | 历史备份与恢复 |
| S6 | 进入学习模式 |
| S7 | 查看周期洞察 |
| S8 | 返回当前层级 |
| 旋钮 | 选择、确认或滚动长内容 |

- 四种牌阵：单卡指引、时间之流、命运抉择、凯尔特十字。
- 78 张原创视觉牌面，正逆位在洗牌时锁定。
- 默认使用本地知识和 mock provider，不访问付费模型。
- 历史、学习状态和周期洞察保存在浏览器本地。
- 支持普通键盘数字键、方向键、Enter、Escape 和鼠标操作。

## 在线体验

| 入口 | 用途 | AI 模式 |
|---|---|---|
| [ChatGPT Sites 正式站](https://cyber-tarot-between-signals.a0921093504.chatgpt.site/) | 当前正式发布版本 | 本地 mock |
| [GitHub Pages](https://pansi0909.github.io/cyber-tarot-easyinput/) | 与仓库 `main` 对应的公开演示 | 本地 mock |
| 本地 `server.mjs` | 开发与可选真实模型接入 | mock 或服务端百炼 |

GitHub Pages 是纯静态站点，不提供 `/api/readings` 或 `/api/insights`。真实模型密钥只能放在未提交的服务端环境文件中。

## 本地运行

### 零成本静态模式

```bash
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

打开 <http://127.0.0.1:4173/>。不要直接双击 `dist/index.html`。

### 本地服务端模式

```bash
node server.mjs
```

默认仍使用 mock。需要连接百炼时，复制 `.env.example` 为不会提交的 `.env.local`，配置服务端变量后运行：

```bash
node --env-file=.env.local server.mjs
```

### 网站测试

```bash
node --test tests/*.test.mjs
```

当前基线为 93 项测试全部通过、没有跳过项；最新结果以 `main` 分支 CI 输出为准。

## AI 硬件复刻案例

完整案例位于 [`case-studies/easyinput-host-action-v1/`](case-studies/easyinput-host-action-v1/README.md)。它保留：

- Host Action v1 配置、事件、共享协议编码与 USB/BLE 接入；
- 八键覆盖、能力声明和 60 项宿主测试；
- ESP-IDF 5.5.5 构建入口；
- 从只读基线到真机验证的 12 步脱敏记录。

案例基于 [`CY-CHENYUE/easy-input-maker`](https://github.com/CY-CHENYUE/easy-input-maker) 的 `course/host-action-v1-starter`，不是原创硬件平台，也不代表上游维护者对本项目的背书。

## 仓库导航

- [`dist/`](dist/)：可直接发布的静态网站。
- [`server/`](server/)：服务端 Provider、输入校验与提示词。
- [`design/`](design/)：牌面、交互和资产来源记录。
- [`COURSE-8-DELIVERY.md`](COURSE-8-DELIVERY.md)：课程交付与演示脚本。
- [`QA.md`](QA.md)：回归、浏览器和实体开发板验收记录。
- [`docs/architecture.md`](docs/architecture.md)：硬件到网页的数据链路。
- [`docs/learning-guide.md`](docs/learning-guide.md)：第 2–8 课学习路线。
- [`docs/README.md`](docs/README.md)：按学习目标组织的完整资料入口。

## 隐私与安全

- 不提交真实 API 密钥、Wi-Fi 凭据、设备唯一标识或私人占卜内容。
- 浏览器历史默认只存放在本机 IndexedDB；跨设备迁移需要用户主动导出和恢复。
- 烧录会覆盖设备固件，本仓库不会在测试或 CI 中自动执行烧录。
- 塔罗内容只用于自我反思，不构成医疗、法律、财务或其他专业建议。

## 许可证

这是一个混合许可证仓库：

- 赛博塔罗程序代码：MIT；
- 原创牌面、截图、设计资料和课程文档：CC BY-NC-SA 4.0；
- EasyInput Host Action v1 案例：PolyForm Noncommercial 1.0.0，并继续遵守其中的 Required Notice 和第三方许可证。

准确范围见 [`LICENSE-SCOPE.md`](LICENSE-SCOPE.md)。如果计划将 EasyInput 衍生固件用于商业硬件，请先取得原许可方授权。

## 参与改进

欢迎提交可公开复现的问题、文档修正和小范围改进。开始前请阅读 [`CONTRIBUTING.md`](CONTRIBUTING.md)；安全问题请按 [`SECURITY.md`](SECURITY.md) 处理。
