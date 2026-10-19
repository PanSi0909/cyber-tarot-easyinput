# 牌面 V2 封存与续作说明

状态：`PRODUCTION_READY_LOCAL`（2026-10-19）

三类最终牌框、四批 70 张原创牌面及最后 5 张原始样卡均已通过。当前 78 张资产全部标记为 `approved`，本地生产牌面已映射至网页优化副本；尚未合并到 `main`，也未发布正式网站。

四批提示词和构图规则分别见 `design/card-art-v2-batch-01-prompts.md` 至 `design/card-art-v2-batch-04-prompts.md`。1024 × 1536 原图保留在 `dist/assets/course-6/cards/`，640 × 960 网页副本位于 `dist/assets/course-6/cards-v2-web/`。

## 已确认的下一版牌框要求

- 移除牌面上方的编号和正位标签。
- 底部移除中文名和关键词，只保留放大的英文名。
- 逆位时只将插画主体旋转 180°，不得拉伸、镜像或扭曲；英文牌名保持正向可读。
- 保持当前黑曜石、暗青、旧金、羊皮纸与低饱和雕版画风格。
- 小阿卡纳数字牌的主体场景必须自然包含对应数量的花色元素；不能用漂浮按钮或事后覆盖图标代替。
- 只使用原创、程序化生成或许可清晰的素材。

## 当前资产

共同提示词和逐张构图说明见 `design/card-pilot-prompts.md`。原始 8 张样卡及四批位图均位于 `dist/assets/course-6/cards/`。

第四批包括：

- 数字牌：`wands-nine.jpg`、`wands-ten.jpg`、`cups-eight.jpg`、`cups-nine.jpg`、`cups-ten.jpg`、`swords-seven.jpg`、`swords-nine.jpg`、`swords-ten.jpg`、`pentacles-five.jpg`、`pentacles-seven.jpg`、`pentacles-eight.jpg`、`pentacles-nine.jpg`
- 宫廷牌：`wands-queen.jpg`、`wands-king.jpg`、`cups-queen.jpg`、`cups-king.jpg`、`swords-knight.jpg`、`swords-queen.jpg`、`pentacles-knight.jpg`、`pentacles-king.jpg`

第三批包括：

- 03A：`major-justice.jpg`、`major-hanged-man.jpg`、`major-temperance.jpg`、`major-devil.jpg`、`major-tower.jpg`、`major-star.jpg`、`major-moon.jpg`、`major-sun.jpg`、`major-judgement.jpg`、`major-world.jpg`
- 03B：`wands-six.jpg`、`wands-seven.jpg`、`wands-eight.jpg`、`cups-four.jpg`、`cups-five.jpg`、`cups-six.jpg`、`swords-five.jpg`、`swords-six.jpg`、`pentacles-three.jpg`、`pentacles-four.jpg`

第二批包括：

- 02A：`major-hierophant.jpg`、`major-lovers.jpg`、`major-chariot.jpg`、`wands-ace.jpg`、`wands-two.jpg`、`wands-four.jpg`、`cups-ace.jpg`、`cups-three.jpg`、`swords-page.jpg`、`pentacles-page.jpg`
- 02B：`major-strength.jpg`、`major-hermit.jpg`、`major-wheel.jpg`、`swords-ace.jpg`、`swords-two.jpg`、`swords-four.jpg`、`pentacles-ace.jpg`、`pentacles-two.jpg`、`cups-page.jpg`、`wands-knight.jpg`

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

全套 78 张均已通过。完整机器清单及生产开关见 `design/card-art-v2-manifest.json`。

## 尚未执行

- 用户在本地正式流程中复验抽牌、正逆位、学习模式和窄屏显示。
- 用户确认后再合并到 `main`。
- 合并后再单独决定是否发布正式网站。

## 何时恢复

只有同时满足以下条件才恢复这项工作：

1. S6 学习模式及本课其余功能已完成并通过回归；
2. 用户明确要求继续“牌面 V2”；
3. 先确认一张大牌、一张数字牌和一张宫廷牌的最终牌框样式；
4. 生成预算与批次大小再次得到用户确认。

继续时可直接发送：

> 请读取 `design/card-art-v2-handoff.md` 和 `design/card-art-v2-manifest.json`，继续赛博塔罗牌面 V2 计划。先复核三类最终样卡，不要改业务逻辑，也不要一次性生成余下全部牌面。

## 推荐验收与合并方法

1. 在本地正式占卜页检查单张、五张和十张牌阵，确认牌面清晰且无缺图。
2. 检查正逆位：只旋转插画，牌框与英文名始终正向。
3. 检查 S6 学习模式与手机窄屏显示。
4. 本地验收通过后再合并到 `main`；发布属于后续独立步骤。
5. 若需要回退，撤销 `dist/card-visuals.mjs` 的 V2 映射即可，旧渲染路径仍保留。

本封存不包含发布操作，也没有修改 EasyInput、实体键位或固件。
