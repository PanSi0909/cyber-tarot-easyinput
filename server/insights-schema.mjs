import {insightSummarySchemaVersion,minimumInsightRecords} from '../dist/insights.mjs';

export const insightJsonSchema={
  type:'object',additionalProperties:false,
  required:['mainThemes','repeatedPatterns','attentionPoints','reflectionQuestions','actionSuggestions','disclaimer'],
  properties:{
    mainThemes:{type:'array',minItems:1,maxItems:5,items:{type:'string'}},
    repeatedPatterns:{type:'array',minItems:1,maxItems:5,items:{type:'string'}},
    attentionPoints:{type:'array',minItems:1,maxItems:5,items:{type:'string'}},
    reflectionQuestions:{type:'array',minItems:1,maxItems:5,items:{type:'string'}},
    actionSuggestions:{type:'array',minItems:1,maxItems:5,items:{type:'string'}},
    disclaimer:{type:'string'}
  }
};

export function assertInsightSummary(summary){
  if(!summary||summary.schemaVersion!==insightSummarySchemaVersion||!summary.sufficient||!Number.isInteger(summary.recordCount)||summary.recordCount<minimumInsightRecords)throw new Error('周期洞察统计摘要无效或数据不足。');
  if(!summary.range||!Number.isInteger(summary.range.days)||Number.isNaN(Date.parse(summary.range.start))||Number.isNaN(Date.parse(summary.range.end)))throw new Error('周期洞察时间范围无效。');
  if(!Array.isArray(summary.spreads)||!Array.isArray(summary.repeatedCards)||!summary.orientations||!summary.questionTimes||!Array.isArray(summary.records)||summary.records.length>20)throw new Error('周期洞察统计字段无效。');
  return summary;
}
