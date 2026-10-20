# 上游来源与修改说明

## 来源

- 项目：EasyInput Maker
- 上游仓库：<https://github.com/CY-CHENYUE/easy-input-maker>
- 课程起点分支：`course/host-action-v1-starter`
- 起点提交：`743368ac86b8`（短提交 `743368a`）
- 目标硬件：EasyInput V2.0 / ESP32-S3

本目录从上述课程起点的本地工作区导入，只包含 Git 已跟踪文件和非忽略的新成果；没有复制嵌套 `.git`、构建目录、固件镜像、缓存、凭据或原始私有日志。

## 本实践的主要增量

- Host Action v1 UUID 校验、配置保留、press-only 事件和共享编码；
- KEY1–KEY8 参数化覆盖；
- USB/BLE Vendor HID 发送与单通道路由；
- 能力声明与 BLE 状态预算测试；
- 宿主测试、ESP-IDF 构建、烧录前审计和脱敏真机验收记录。

这是一份学习复刻和验证案例，不改变上游作者、版权主体或许可证归属，也不表示上游维护者对赛博塔罗项目的认可或背书。

## Required Notice

Copyright 2026 深圳物启万相人工智能有限公司.
Original author: CY-CHENYUE.
EasyInput Maker is a WaytoAGI community project.

完整 PolyForm Noncommercial 1.0.0 条款见本目录 `LICENSE`；独立第三方组件继续遵守 `THIRD_PARTY_NOTICES.md` 和对应 `LICENSES/` 文件。
