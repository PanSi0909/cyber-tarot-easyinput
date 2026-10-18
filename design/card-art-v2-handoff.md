# 牌面 V2 封存与续作说明

状态：`BATCH_01_APPROVED`（2026-10-18）

三类最终牌框和第一批 10 张原创牌面均已获得用户确认，当前共 18 张资产、13 张已批准；仍不把任何 V2 资产混入正式占卜。正式页面继续使用完整一致的现有 78 张牌面体系；所有 V2 资产仅在 `dist/card-pilot.html` 中查看。

三类牌框代表 `major-fool`、`wands-three`、`cups-knight` 与第一批 10 张均已标记为 `approved`。第一批提示词和构图规则见 `design/card-art-v2-batch-01-prompts.md`。其余 5 张原始样卡仍需逐张复核；第二批尚未开始。

## 已确认的下一版牌框要求

- 移除牌面上方的编号和正位标签。
- 底部移除中文名和关键词，只保留放大的英文名。
- 逆位时只将插画主体旋转 180°，不得拉伸、镜像或扭曲；英文牌名保持正向可读。
- 保持当前黑曜石、暗青、旧金、羊皮纸与低饱和雕版画风格。
- 小阿卡纳数字牌的主体场景必须自然包含对应数量的花色元素；不能用漂浮按钮或事后覆盖图标代替。
- 只使用原创、程序化生成或许可清晰的素材。

## 当前资产

共同提示词和逐张构图说明见 `design/card-pilot-prompts.md`。原始 8 张样卡与第一批 10 张位图均位于 `dist/assets/course-6/cards/`。

第一批包括：

- `major-magician.jpg`
- `major-high-priestess.jpg`
- `major-empress.jpg`
- `major-emperor.jpg`
- `wands-five.jpg`
- `cups-two.jpg`
- `swords-eight.jpg`
- `pentacles-six.jpg`
- `wands-page.jpg`
- `swords-king.jpg`

原始样卡包括：

- `major-fool.jpg`
- `major-death.jpg`
- `wands-three.jpg`
- `cups-seven.jpg`
- `swords-three.jpg`
- `pentacles-ten.jpg`
- `cups-knight.jpg`
- `pentacles-queen.jpg`

原始样卡中的三类牌框代表与第一批 10 张均已通过，其余 5 张原始样卡仍为 `needs-layout-review`。完整机器清单见 `design/card-art-v2-manifest.json`。

## 未完成范围

- 16 张大阿卡纳插画。
- 32 张数字小阿卡纳插画。
- 12 张宫廷牌插画。
- 15 张现有资产的逐张内容或牌框复核与必要重绘。
- 78 张统一性、数量准确性、正逆位和窄屏验收。

## 何时恢复

只有同时满足以下条件才恢复这项工作：

1. S6 学习模式及本课其余功能已完成并通过回归；
2. 用户明确要求继续“牌面 V2”；
3. 先确认一张大牌、一张数字牌和一张宫廷牌的最终牌框样式；
4. 生成预算与批次大小再次得到用户确认。

继续时可直接发送：

> 请读取 `design/card-art-v2-handoff.md` 和 `design/card-art-v2-manifest.json`，继续赛博塔罗牌面 V2 计划。先复核三类最终样卡，不要改业务逻辑，也不要一次性生成余下全部牌面。

## 推荐续作与合并方法

1. 每批生成 6–10 张，逐张核对元素数量、象征物、裁切安全区和风格一致性。
2. 只在独立 `card-pilot.html` 中评审；把通过项在 manifest 中改为 `approved`。
3. 78 张全部通过后，再一次性把已批准资产映射接入 `dist/card-visuals.mjs`；不要边生成边混入生产牌组。
4. 运行牌面、业务和响应式测试，确认 78 张资源完整、数字元素数量正确、逆位不变形。
5. 若上线后需要回退，只需撤销 V2 资产映射；当前旧牌面渲染路径会一直保留到 V2 全量验收结束。

本封存不包含发布操作，也没有修改 EasyInput、实体键位或固件。
