import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fresh,transition,keyInput,fixedTextAction} from '../dist/core.mjs';
import {buildReadingInput,requestInitialReading,createReadingSession,mockReadingProvider} from '../dist/ai-reading.mjs';
import {createHistoryRecord} from '../dist/history.mjs';
import {insightRanges,minimumInsightRecords,freshInsightState,insightTransition,analyzeHistory,buildInsightSummary,requestInsight,mockInsightProvider,createInsightReport,validateInsightReport,insightReportSchemaVersion} from '../dist/insights.mjs';
import {resolveProviderConfig} from '../server/config.mjs';
import {generateInsight} from '../server/providers.mjs';
import {createTarotServer} from '../server.mjs';

async function seedRecord(createdAt='2026-10-14T10:00:00.000Z'){
  let state=transition(fresh(),'start');state=transition(state,'setup');state=transition(state,'confirm',()=>0.9);state=transition(state,{type:'set-question',value:'我现在需要看清什么？'});state=transition(state,'confirm');
  const input=buildReadingInput(state),reading=await requestInitialReading(mockReadingProvider,input),session=createReadingSession(input,reading,mockReadingProvider.id,createdAt);
  return createHistoryRecord(state,input,session,createdAt);
}
function at(record,createdAt,index){return {...structuredClone(record),id:`${record.id}-${index}`,createdAt,updatedAt:createdAt,question:`问题 ${index}`};}

test('S7 固定文字、主键盘、小键盘与鼠标入口使用同一 insights 动作',()=>{
  assert.equal(fixedTextAction('周期洞察'),'insights');assert.equal(fixedTextAction(' S7 周期 洞察 '),'insights');
  assert.equal(keyInput({code:'Digit7'},new Set()).action,'insights');assert.equal(keyInput({code:'Numpad7'},new Set()).action,'insights');
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');assert.match(html,/id="insights-toggle"[^>]*>周期洞察<\/button>/);
});

test('旋钮在 7、30、365 天之间循环且不修改其他状态',()=>{
  const base=insightTransition(freshInsightState(),'toggle');assert.deepEqual(insightRanges.map(item=>item.days),[7,30,365]);
  assert.equal(insightTransition(base,'left').rangeIndex,2);assert.equal(insightTransition({...base,rangeIndex:2},'right').rangeIndex,0);
  assert.equal(insightTransition(base,{type:'select-range',index:1}).rangeIndex,1);
});

test('时间过滤包含起止边界、排除更早和未来记录，并计算客观统计',async()=>{
  const base=await seedRecord(),records=[
    at(base,'2026-10-08T00:00:00.000Z',1),at(base,'2026-10-14T09:00:00.000Z',2),at(base,'2026-10-15T00:00:00.000Z',3),
    at(base,'2026-10-07T23:59:59.999Z',4),at(base,'2026-10-15T00:00:00.001Z',5)
  ],analysis=analyzeHistory(records,7,'2026-10-15T00:00:00.000Z','UTC');
  assert.equal(analysis.recordCount,3);assert.equal(analysis.sufficient,true);assert.equal(analysis.needed,0);assert.equal(analysis.spreads[0].count,3);assert.equal(analysis.repeatedCards[0].count,3);assert.equal(analysis.orientations.total,3);assert.equal(analysis.orientations.uprightPercent+analysis.orientations.reversedPercent,100);assert.ok(analysis.questionTimes.dayParts.length);
});

test('少于三条记录诚实降级且不会调用 AI',async()=>{
  const base=await seedRecord(),analysis=analyzeHistory([base],30,'2026-10-15T00:00:00.000Z','UTC'),summary=buildInsightSummary(analysis);let called=0;
  assert.equal(analysis.sufficient,false);assert.equal(analysis.needed,minimumInsightRecords-1);
  await assert.rejects(requestInsight({generateInsight:async()=>{called++;}},summary),/数据不足/);assert.equal(called,0);
});

test('统计摘要覆盖全部样本并只携带最多二十条可追溯摘录',async()=>{
  const base=await seedRecord(),records=Array.from({length:25},(_,index)=>at(base,`2026-10-${String(14-index%10).padStart(2,'0')}T10:00:00.000Z`,index)),before=JSON.stringify(records),analysis=analyzeHistory(records,30,'2026-10-15T00:00:00.000Z','UTC'),summary=buildInsightSummary(analysis);
  assert.equal(summary.recordCount,25);assert.equal(summary.includedRecordCount,20);assert.equal(summary.records.length,20);assert.ok(summary.records[0].firstReading.synthesis);assert.ok(Array.isArray(summary.records[0].followUps));assert.equal(JSON.stringify(records),before);
});

test('AI 失败可重试且不会修改原始历史，成功结果包含五类输出',async()=>{
  const base=await seedRecord(),records=[at(base,'2026-10-12T10:00:00.000Z',1),at(base,'2026-10-13T10:00:00.000Z',2),at(base,'2026-10-14T10:00:00.000Z',3)],before=JSON.stringify(records),summary=buildInsightSummary(analyzeHistory(records,7,'2026-10-15T00:00:00.000Z','UTC'));let attempts=0;
  const provider={generateInsight:async input=>{attempts++;if(attempts===1)throw new Error('temporary');return mockInsightProvider.generateInsight(input);}};
  await assert.rejects(requestInsight(provider,summary),/temporary/);const result=await requestInsight(provider,summary);
  assert.equal(attempts,2);assert.equal(JSON.stringify(records),before);for(const key of ['mainThemes','repeatedPatterns','attentionPoints','reflectionQuestions','actionSuggestions'])assert.ok(result[key].length);assert.match(result.disclaimer,/不是确定性预测/);
});

test('周期洞察记录使用独立版本并记录来源历史 ID',async()=>{
  const base=await seedRecord(),records=[at(base,'2026-10-12T10:00:00.000Z',1),at(base,'2026-10-13T10:00:00.000Z',2),at(base,'2026-10-14T10:00:00.000Z',3)],before=JSON.stringify(records),analysis=analyzeHistory(records,7,'2026-10-15T00:00:00.000Z','UTC'),result=await requestInsight(mockInsightProvider,buildInsightSummary(analysis)),report=createInsightReport(analysis,result,mockInsightProvider.id,'2026-10-15T00:01:00.000Z');
  assert.equal(report.schemaVersion,insightReportSchemaVersion);assert.equal(report.source.recordIds.length,3);assert.equal(report.source.recordCount,3);assert.equal(validateInsightReport(report).id,report.id);assert.equal(JSON.stringify(records),before);
});

test('服务端默认 mock 周期洞察不访问外部网络',async()=>{
  const base=await seedRecord(),records=[at(base,'2026-10-12T10:00:00.000Z',1),at(base,'2026-10-13T10:00:00.000Z',2),at(base,'2026-10-14T10:00:00.000Z',3)],summary=buildInsightSummary(analyzeHistory(records,7,'2026-10-15T00:00:00.000Z','UTC'));
  const result=await generateInsight(resolveProviderConfig({TAROT_AI_PROVIDER:'mock'}),summary,()=>{throw new Error('不应访问网络');});assert.ok(result.mainThemes.length);
});

test('/api/insights 经现有安全服务端返回五类 mock 洞察',async()=>{
  const base=await seedRecord(),records=[at(base,'2026-10-12T10:00:00.000Z',1),at(base,'2026-10-13T10:00:00.000Z',2),at(base,'2026-10-14T10:00:00.000Z',3)],summary=buildInsightSummary(analyzeHistory(records,7,'2026-10-15T00:00:00.000Z','UTC')),server=createTarotServer({TAROT_AI_PROVIDER:'mock'});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  try{
    const {port}=server.address(),response=await fetch(`http://127.0.0.1:${port}/api/insights`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({summary})}),body=await response.json();
    assert.equal(response.status,200);for(const key of ['mainThemes','repeatedPatterns','attentionPoints','reflectionQuestions','actionSuggestions'])assert.ok(body.result[key].length);
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('周期洞察页面标注数据来源、独立保存与安全边界',()=>{
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  for(const id of ['insights-overlay','insights-command-input','insights-range-options','insights-generate','insights-statistics','insights-output','insights-retry'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/少于 3 条时只显示数据不足/);assert.match(html,/历史只读 · 洞察独立保存/);
});

test('洞察或数据不足统计显示后旋钮浏览长内容，短按返回范围选择',()=>{
  const app=readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8');
  assert.match(app,/const browsing=\['ready','insufficient'\]\.includes\(insights\.status\)/);
  assert.match(app,/if\(browsing&&\['left','right'\]\.includes\(action\)\)return scrollInsightContent/);
  assert.match(app,/if\(browsing&&action==='confirm'\)return resetInsightRangeSelection/);
  assert.match(app,/overlay\.scrollBy\(\{top:action==='right'\?distance:-distance,behavior\}\)/);
});

test('档案工具并列放在顶部且页面入口不重复显示 S5 S6 S7 徽标',()=>{
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),nav=html.match(/<nav class="utility-nav"[\s\S]*?<\/nav>/)?.[0]||'';
  for(const id of ['learning-toggle','history-tool-toggle','insights-toggle'])assert.match(nav,new RegExp(`id="${id}"`));
  assert.doesNotMatch(html,/(?:历史备份|学习模式|周期洞察)\s*<kbd>S[567]<\/kbd>/);
});
