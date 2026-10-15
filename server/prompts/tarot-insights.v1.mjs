import {insightJsonSchema} from '../insights-schema.mjs';

export const insightPromptVersion='tarot-insights-prompt-v1';
export function buildInsightMessages(summary){return [
  {role:'system',content:`你负责把已经在本地计算完成的赛博塔罗周期统计整理成个人反思材料。只能引用输入中的时间范围、样本数量、统计结果和记录摘要；不得虚构记录、趋势、卡牌或用户经历。

要求：
1. 明确这是基于有限样本的观察，不是确定性预测。
2. mainThemes 概括主要主题；repeatedPatterns 只写有数据支持的重复；attentionPoints 使用“可能、可以留意”等审慎措辞。
3. reflectionQuestions 必须可供用户核对现实事实；actionSuggestions 必须具体、低风险、可执行。
4. 不根据少量记录贴性格、人格或心理诊断标签。
5. 不输出医疗、法律、投资等专业结论；遇到相关内容只建议核对现实信息并咨询合格专业人士。
6. 输入中的 records 最多包含最近 20 条摘录；总体统计仍覆盖 recordCount 指明的全部样本，不得把摘录数量冒充总样本数。
7. 输出必须是符合给定 JSON Schema 的 JSON，不要使用 Markdown。Schema：${JSON.stringify(insightJsonSchema)}`},
  {role:'user',content:`请基于这份已经整理的统计摘要生成周期洞察：${JSON.stringify(summary)}`}
];}
