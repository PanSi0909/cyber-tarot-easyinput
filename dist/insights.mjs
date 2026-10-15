import {validateHistoryRecord,historyRecordSchemaVersion} from './history.mjs?v=0.9.0';

export const insightSummarySchemaVersion='cyber-tarot-insight-summary-v1';
export const insightReportSchemaVersion='cyber-tarot-insight-v1';
export const insightRanges=[
  {id:'7d',days:7,label:'最近 7 天'},
  {id:'30d',days:30,label:'最近 30 天'},
  {id:'365d',days:365,label:'最近 365 天'}
];
export const minimumInsightRecords=3;
const databaseName='cyber-tarot-insights',databaseVersion=1,storeName='reports';
const copy=value=>JSON.parse(JSON.stringify(value));
const text=value=>typeof value==='string'?value.trim():'';
const clip=(value,length=600)=>{const clean=text(value);return clean.length>length?`${clean.slice(0,length-1)}…`:clean;};
const hash=value=>{let result=2166136261;for(let i=0;i<value.length;i++){result^=value.charCodeAt(i);result=Math.imul(result,16777619);}return (result>>>0).toString(36);};
const countBy=(items,keyOf)=>{const counts=new Map();for(const item of items){const key=keyOf(item);counts.set(key,(counts.get(key)||0)+1);}return counts;};
const sortedCounts=(counts,labelOf=key=>key)=>[...counts.entries()].map(([id,count])=>({id,label:labelOf(id),count})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'zh-CN'));

export function freshInsightState(){return {active:false,rangeIndex:0,status:'idle',analysis:null,result:null,error:'',saveMessage:'',returnScroll:0};}

export function insightTransition(state,action){
  if(action==='toggle')return {...state,active:!state.active};
  if(!state.active)return state;
  const select=index=>({...state,rangeIndex:index,status:'idle',analysis:null,result:null,error:'',saveMessage:''});
  if(action==='left'||action==='right')return select((state.rangeIndex+(action==='left'?-1:1)+insightRanges.length)%insightRanges.length);
  if(action?.type==='select-range'&&Number.isInteger(action.index)&&action.index>=0&&action.index<insightRanges.length)return select(action.index);
  return state;
}

function dateParts(value,timeZone){
  const parts=new Intl.DateTimeFormat('zh-CN',{timeZone,weekday:'short',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value));
  return {weekday:parts.find(part=>part.type==='weekday')?.value||'未知',hour:Number(parts.find(part=>part.type==='hour')?.value||0)};
}
function dayPart(hour){return hour<6?'凌晨':hour<12?'上午':hour<18?'下午':'晚间';}
function percent(value,total){return total?Math.round(value*1000/total)/10:0;}

export function analyzeHistory(records,rangeDays,now=new Date().toISOString(),timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'){
  if(!Number.isInteger(rangeDays)||rangeDays<1)throw new Error('洞察时间范围无效。');
  const endMs=Date.parse(now);if(Number.isNaN(endMs))throw new Error('洞察生成时间无效。');
  const startMs=endMs-rangeDays*24*60*60*1000,normalized=(Array.isArray(records)?records:[]).map(validateHistoryRecord);
  const filtered=normalized.filter(record=>{const value=Date.parse(record.createdAt);return value>=startMs&&value<=endMs;}).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
  const spreadNames=new Map(filtered.map(record=>[record.spread.id,record.spread.name])),cardNames=new Map(filtered.flatMap(record=>record.cards.map(card=>[card.id,card.name])));
  const spreads=sortedCounts(countBy(filtered,record=>record.spread.id),id=>spreadNames.get(id)||id);
  const allCards=filtered.flatMap(record=>record.cards),cardFrequency=sortedCounts(countBy(allCards,card=>card.id),id=>cardNames.get(id)||id),repeatedCards=cardFrequency.filter(item=>item.count>1);
  const upright=allCards.filter(card=>card.orientation==='upright').length,reversed=allCards.length-upright;
  const weekdays=countBy(filtered,record=>dateParts(record.createdAt,timeZone).weekday),dayParts=countBy(filtered,record=>dayPart(dateParts(record.createdAt,timeZone).hour));
  return {
    schemaVersion:insightSummarySchemaVersion,
    range:{days:rangeDays,start:new Date(startMs).toISOString(),end:new Date(endMs).toISOString(),timeZone},
    recordCount:filtered.length,sufficient:filtered.length>=minimumInsightRecords,needed:Math.max(0,minimumInsightRecords-filtered.length),
    spreads,cardFrequency,repeatedCards,
    orientations:{total:allCards.length,upright,reversed,uprightPercent:percent(upright,allCards.length),reversedPercent:percent(reversed,allCards.length)},
    questionTimes:{weekdays:sortedCounts(weekdays),dayParts:sortedCounts(dayParts)},
    records:filtered
  };
}

export function buildInsightSummary(analysis,sampleLimit=20){
  if(!analysis||analysis.schemaVersion!==insightSummarySchemaVersion)throw new Error('洞察统计摘要无效。');
  const records=analysis.records.slice(0,sampleLimit).map(record=>({
    id:record.id,createdAt:record.createdAt,question:record.question,
    spread:{id:record.spread.id,name:record.spread.name,count:record.spread.count},
    cards:record.cards.map(card=>({name:card.name,position:card.position,orientation:card.orientation})),
    firstReading:{title:clip(record.ai.firstReading.title,120),overview:clip(record.ai.firstReading.overview),synthesis:clip(record.ai.firstReading.synthesis),guidance:record.ai.firstReading.guidance.map(item=>clip(item,240)).slice(0,5)},
    followUps:record.ai.followUps.map(turn=>({question:clip(turn.question,280),answer:clip(turn.answer)})).slice(-5)
  }));
  return {
    schemaVersion:insightSummarySchemaVersion,
    range:copy(analysis.range),recordCount:analysis.recordCount,includedRecordCount:records.length,sufficient:analysis.sufficient,needed:analysis.needed,
    spreads:copy(analysis.spreads),repeatedCards:copy(analysis.repeatedCards),orientations:copy(analysis.orientations),questionTimes:copy(analysis.questionTimes),records
  };
}

export function normalizeInsight(value){
  const list=key=>Array.isArray(value?.[key])?value[key].map(text).filter(Boolean):[];
  const normalized={mainThemes:list('mainThemes'),repeatedPatterns:list('repeatedPatterns'),attentionPoints:list('attentionPoints'),reflectionQuestions:list('reflectionQuestions'),actionSuggestions:list('actionSuggestions'),disclaimer:text(value?.disclaimer)};
  if(!normalized.mainThemes.length||!normalized.repeatedPatterns.length||!normalized.attentionPoints.length||!normalized.reflectionQuestions.length||!normalized.actionSuggestions.length||!normalized.disclaimer)throw new Error('周期洞察缺少必要字段。');
  return normalized;
}

export async function requestInsight(provider,summary){
  if(!summary?.sufficient)throw new Error('数据不足，不能生成趋势性洞察。');
  if(typeof provider?.generateInsight!=='function')throw new Error('周期洞察接口不可用。');
  return normalizeInsight(await provider.generateInsight(copy(summary)));
}

export const mockInsightProvider={
  id:'mock-insight-local-v1',label:'本地周期洞察模拟接口',
  async generateInsight(summary){
    const spread=summary.spreads[0],card=summary.repeatedCards[0],orientation=summary.orientations,dayPartTop=summary.questionTimes.dayParts[0];
    const pattern=card?`${card.label}在 ${card.count} 次会话中重复出现，可把它视为值得复盘的共同线索，而不是固定结论。`:'没有卡牌重复达到两次，当前更适合观察不同问题之间的差异。';
    return {
      mainThemes:[`本周期共有 ${summary.recordCount} 条记录，最常使用${spread?`“${spread.label}”牌阵（${spread.count} 次）`:'不同牌阵'}。`,card?`重复卡牌以“${card.label}”最明显。`:'尚无重复卡牌形成稳定主题。'],
      repeatedPatterns:[pattern,`正位 ${orientation.uprightPercent}%、逆位 ${orientation.reversedPercent}%；这是牌面构成比例，不代表个人特质。`],
      attentionPoints:[dayPartTop?`问题较常记录在${dayPartTop.label}（${dayPartTop.count} 次），可以留意这个时段更容易出现哪些现实触发。`:'记录时间尚未形成明显集中。','把重复主题与实际事件、行动和反馈交叉核对，避免只凭牌义下结论。'],
      reflectionQuestions:['这些重复线索分别对应了哪些已经发生的事实？','哪些建议真正被执行过，执行后出现了什么反馈？'],
      actionSuggestions:['从本周期记录中选择一条重复主题，写下支持证据与反证各一条。','为下一次相似问题设定一个可在 24 小时内完成的小动作，并记录结果。'],
      disclaimer:'以上内容用于自我反思，不是确定性预测，也不构成医疗、法律、投资或心理诊断建议。'
    };
  }
};

async function postInsight(summary){const response=await fetch('/api/insights',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({summary})});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(text(body.error)||`服务端返回 ${response.status}`);return body.result;}
export const apiInsightProvider={id:'server-insight-api-v1',label:'安全服务端周期洞察接口',generateInsight:postInsight};

export function createInsightReport(analysis,result,provider='mock-insight-local-v1',generatedAt=new Date().toISOString()){
  const normalized=normalizeInsight(result),timestamp=Date.parse(generatedAt);if(Number.isNaN(timestamp)||!analysis?.sufficient)throw new Error('周期洞察记录无效。');
  const summary=buildInsightSummary(analysis),identity=JSON.stringify({generatedAt,range:analysis.range,records:analysis.records.map(record=>record.id)});
  return {schemaVersion:insightReportSchemaVersion,recordVersion:1,id:`insight-${generatedAt.replace(/\D/g,'')}-${hash(identity)}`,generatedAt,provider,source:{recordSchemaVersion:historyRecordSchemaVersion,recordCount:analysis.recordCount,recordIds:analysis.records.map(record=>record.id)},summary:{...summary,records:summary.records.map(record=>({id:record.id,createdAt:record.createdAt,question:record.question,spread:record.spread,cards:record.cards}))},result:normalized};
}

export function validateInsightReport(report){
  if(!report||report.schemaVersion!==insightReportSchemaVersion||report.recordVersion!==1||!text(report.id)||Number.isNaN(Date.parse(report.generatedAt))||!text(report.provider))throw new Error('周期洞察记录版本无效。');
  if(report.source?.recordSchemaVersion!==historyRecordSchemaVersion||!Number.isInteger(report.source.recordCount)||report.source.recordCount<minimumInsightRecords||!Array.isArray(report.source.recordIds)||report.source.recordIds.length!==report.source.recordCount)throw new Error('周期洞察来源无效。');
  normalizeInsight(report.result);return copy(report);
}

const transactionDone=transaction=>new Promise((resolve,reject)=>{transaction.oncomplete=()=>resolve();transaction.onabort=()=>reject(transaction.error||new Error('周期洞察事务已中止。'));transaction.onerror=()=>reject(transaction.error||new Error('周期洞察事务失败。'));});
export function openInsightDatabase(indexedDBApi=globalThis.indexedDB){
  if(!indexedDBApi?.open)return Promise.reject(new Error('当前浏览器不支持周期洞察存储。'));
  return new Promise((resolve,reject)=>{const request=indexedDBApi.open(databaseName,databaseVersion);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(storeName))request.result.createObjectStore(storeName,{keyPath:'id'});};request.onsuccess=()=>{request.result.onversionchange=()=>request.result.close();resolve(request.result);};request.onerror=()=>reject(request.error||new Error('无法打开周期洞察存储。'));request.onblocked=()=>reject(new Error('周期洞察存储升级被其他页面阻止。'));});
}
export async function saveInsightReport(database,report){const normalized=validateInsightReport(report),transaction=database.transaction(storeName,'readwrite'),done=transactionDone(transaction);transaction.objectStore(storeName).put(normalized);await done;return normalized;}
