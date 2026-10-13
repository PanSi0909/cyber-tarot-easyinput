import {readingFingerprint} from './ai-reading.mjs?v=0.8.0';

export const historyRecordSchemaVersion='cyber-tarot-history-v1';
export const historyExportSchemaVersion='cyber-tarot-history-export-v1';
const databaseName='cyber-tarot-history',databaseVersion=1,storeName='sessions';
const copy=value=>JSON.parse(JSON.stringify(value));
const text=value=>typeof value==='string'?value.trim():'';
const isDate=value=>Boolean(text(value))&&!Number.isNaN(Date.parse(value));
const hash=value=>{let result=2166136261;for(let i=0;i<value.length;i++){result^=value.charCodeAt(i);result=Math.imul(result,16777619);}return (result>>>0).toString(36);};

export function validateHistoryRecord(record){
  if(!record||record.schemaVersion!==historyRecordSchemaVersion||record.recordVersion!==1)throw new Error('历史记录版本不受支持。');
  if(!text(record.id)||!isDate(record.createdAt)||!isDate(record.updatedAt)||!text(record.question))throw new Error('历史记录的基础信息无效。');
  if(!record.deck||!text(record.deck.id)||!text(record.deck.name)||!Number.isInteger(record.deck.totalCards)||record.deck.totalCards<1)throw new Error('历史记录的牌组无效。');
  if(!record.spread||!text(record.spread.id)||!text(record.spread.name)||!Number.isInteger(record.spread.count)||record.spread.count<1)throw new Error('历史记录的牌阵无效。');
  if(!Array.isArray(record.cards)||record.cards.length!==record.spread.count||new Set(record.cards.map(card=>card.id)).size!==record.cards.length)throw new Error('历史记录的卡牌数量无效。');
  for(const [index,card] of record.cards.entries())if(!card||card.order!==index+1||!text(card.id)||!text(card.name)||!text(card.position)||!['upright','reversed'].includes(card.orientation))throw new Error('历史记录包含无效卡牌。');
  if(!record.ai||!text(record.ai.schemaVersion)||!text(record.ai.knowledgeVersion)||!text(record.ai.provider)||!isDate(record.ai.createdAt)||!record.ai.firstReading||!Array.isArray(record.ai.followUps))throw new Error('历史记录的 AI 解读无效。');
  const reading=record.ai.firstReading;if(!text(reading.title)||!text(reading.overview)||!Array.isArray(reading.cardReadings)||reading.cardReadings.length!==record.cards.length||reading.cardReadings.some(item=>!text(item?.visualReading)||!text(item?.baseMeaning)||!text(item?.contextualReading))||!reading.flow||!text(reading.flow.movement)||!text(reading.flow.tension)||!text(reading.flow.direction)||!text(reading.synthesis)||!Array.isArray(reading.guidance)||!reading.guidance.length||reading.guidance.some(item=>!text(item))||!text(reading.voiceSummary))throw new Error('历史记录的首次解读不完整。');
  for(const turn of record.ai.followUps)if(!text(turn?.question)||!text(turn?.answer))throw new Error('历史记录包含无效追问。');
  return copy(record);
}

export function createHistoryRecord(state,input,session,updatedAt=new Date().toISOString()){
  if(state?.phase!=='revealed'||!input||!session||session.version!==2||session.fingerprint!==readingFingerprint(input))throw new Error('只有完整且匹配的占卜会话才能保存。');
  if(!isDate(session.createdAt)||!isDate(updatedAt))throw new Error('历史记录时间无效。');
  const id=`tarot-${session.createdAt.replace(/\D/g,'')}-${hash(session.fingerprint)}`;
  return validateHistoryRecord({
    schemaVersion:historyRecordSchemaVersion,
    recordVersion:1,
    id,
    createdAt:session.createdAt,
    updatedAt,
    question:input.question,
    deck:{id:state.deckChoice||'rws-78',name:'Rider–Waite–Smith',totalCards:Array.isArray(state.deck)&&state.deck.length?state.deck.length:78},
    spread:{id:input.spread.id,name:input.spread.name,count:input.spread.count},
    cards:input.cards.map((card,index)=>({order:index+1,id:card.id,name:card.name,en:card.en||'',position:card.position,orientation:card.orientation,keywords:card.keywords||''})),
    ai:{schemaVersion:input.schemaVersion,knowledgeVersion:input.knowledgeVersion,provider:session.provider,createdAt:session.createdAt,firstReading:copy(session.firstReading),followUps:copy(session.followUps)}
  });
}

export function upsertHistoryRecord(records,record){
  const current=Array.isArray(records)?records.map(validateHistoryRecord):[],next=validateHistoryRecord(record),index=current.findIndex(item=>item.id===next.id);
  if(index<0)current.push(next);else if(Date.parse(next.updatedAt)>Date.parse(current[index].updatedAt))current[index]=next;
  return current.sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt));
}

export function serializeHistoryBackup(records,exportedAt=new Date().toISOString()){
  if(!isDate(exportedAt))throw new Error('导出时间无效。');
  const normalized=(Array.isArray(records)?records:[]).map(validateHistoryRecord);
  return JSON.stringify({schemaVersion:historyExportSchemaVersion,recordSchemaVersion:historyRecordSchemaVersion,exportedAt,records:normalized},null,2);
}

export function restoreHistoryBackup(existingRecords,raw){
  let backup;try{backup=typeof raw==='string'?JSON.parse(raw):raw;}catch{throw new Error('备份 JSON 无法解析。');}
  if(!backup||backup.schemaVersion!==historyExportSchemaVersion||backup.recordSchemaVersion!==historyRecordSchemaVersion)throw new Error('备份版本不受支持。');
  if(!Array.isArray(backup.records))throw new Error('备份中没有有效的历史记录列表。');
  const imported=backup.records.map(validateHistoryRecord);let records=Array.isArray(existingRecords)?existingRecords.map(validateHistoryRecord):[];
  for(const record of imported)records=upsertHistoryRecord(records,record);
  return {records,imported:imported.length};
}

const requestResult=request=>new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('历史记录请求失败。'));});
const transactionDone=transaction=>new Promise((resolve,reject)=>{transaction.oncomplete=()=>resolve();transaction.onabort=()=>reject(transaction.error||new Error('历史记录事务已中止。'));transaction.onerror=()=>reject(transaction.error||new Error('历史记录事务失败。'));});

export function openHistoryDatabase(indexedDBApi=globalThis.indexedDB){
  if(!indexedDBApi?.open)return Promise.reject(new Error('当前浏览器不支持历史记录存储。'));
  return new Promise((resolve,reject)=>{
    const request=indexedDBApi.open(databaseName,databaseVersion);
    request.onupgradeneeded=()=>{const database=request.result,store=database.objectStoreNames.contains(storeName)?request.transaction.objectStore(storeName):database.createObjectStore(storeName,{keyPath:'id'});if(!store.indexNames.contains('createdAt'))store.createIndex('createdAt','createdAt');if(!store.indexNames.contains('updatedAt'))store.createIndex('updatedAt','updatedAt');if(!store.indexNames.contains('spreadId'))store.createIndex('spreadId','spread.id');};
    request.onsuccess=()=>{const database=request.result;database.onversionchange=()=>database.close();resolve(database);};
    request.onerror=()=>reject(request.error||new Error('无法打开历史记录。'));
    request.onblocked=()=>reject(new Error('历史记录升级被其他页面阻止，请关闭其他页面后重试。'));
  });
}

export async function listHistoryRecords(database){
  const transaction=database.transaction(storeName,'readonly'),done=transactionDone(transaction),request=transaction.objectStore(storeName).getAll(),records=await requestResult(request);await done;
  return records.map(validateHistoryRecord).sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt));
}

export async function saveHistoryRecord(database,record){
  const normalized=validateHistoryRecord(record),transaction=database.transaction(storeName,'readwrite'),done=transactionDone(transaction);transaction.objectStore(storeName).put(normalized);await done;return normalized;
}

export async function replaceHistoryRecords(database,records){
  const normalized=records.map(validateHistoryRecord),transaction=database.transaction(storeName,'readwrite'),done=transactionDone(transaction),store=transaction.objectStore(storeName);store.clear();for(const record of normalized)store.put(record);await done;return normalized;
}
