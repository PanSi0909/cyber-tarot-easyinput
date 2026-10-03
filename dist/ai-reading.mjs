import {cards,spreads,spreadPositions,cardOrientation} from './core.mjs?v=0.6.2';
import {tarotKnowledgeVersion,getCardKnowledge,getPositionLens,analyzeReadingPatterns} from './tarot-knowledge.mjs?v=0.7.0';

export const readingSchemaVersion='tarot-reading-v1';
export const maxFollowUpLength=280;
const maxFollowUps=20;
const clean=value=>typeof value==='string'?value.trim():'';
const clip=(value,length)=>value.length>length?`${value.slice(0,length-1)}…`:value;
const orientationLabel=value=>value==='reversed'?'逆位':'正位';
const firstKeyword=card=>card.keywords.split(' · ')[0];
const joinNatural=values=>values.length<2?values[0]||'':`${values.slice(0,-1).join('、')}与${values.at(-1)}`;

export function buildReadingInput(state){
  if(state?.phase!=='revealed'||!clean(state.question))throw new Error('只有问题和牌阵都锁定后才能生成解读。');
  const spread=spreads.find(item=>item.id===state.spreadChoice),positions=spreadPositions[state.spreadChoice];
  if(!spread||!positions||!Array.isArray(state.results)||state.results.length!==spread.count)throw new Error('牌阵结果不完整。');
  const drawn=state.results.map((id,index)=>{
    const card=cards.find(item=>item.id===id);if(!card)throw new Error('牌阵包含未知卡牌。');
    return {id:card.id,name:card.name,en:card.en,position:positions[index],positionLens:getPositionLens(spread.id,positions[index]),orientation:cardOrientation(state,id),keywords:card.keywords,text:card.text,reflection:card.question,knowledge:getCardKnowledge(card)};
  });
  return {schemaVersion:readingSchemaVersion,knowledgeVersion:tarotKnowledgeVersion,question:state.question,spread:{id:spread.id,name:spread.name,count:spread.count},cards:drawn};
}

export function readingFingerprint(input){
  return JSON.stringify({question:input.question,spread:input.spread.id,cards:input.cards.map(card=>[card.id,card.position,card.orientation])});
}

export function normalizeReading(value,input){
  if(!value||typeof value!=='object')throw new Error('解读接口返回格式无效。');
  const cardReadings=Array.isArray(value.cardReadings)?value.cardReadings.map((item,index)=>({position:input.cards[index]?.position,card:input.cards[index]?.name,orientation:input.cards[index]?.orientation,interpretation:clean(item?.interpretation)})):[];
  const guidance=Array.isArray(value.guidance)?value.guidance.map(clean).filter(Boolean):[];
  const normalized={title:clean(value.title),overview:clean(value.overview),cardReadings,synthesis:clean(value.synthesis),guidance,voiceSummary:clean(value.voiceSummary)};
  if(!normalized.title||!normalized.overview||cardReadings.length!==input.cards.length||cardReadings.some(item=>!item.interpretation)||!normalized.synthesis||!guidance.length||!normalized.voiceSummary)throw new Error('解读接口缺少必要字段。');
  if(normalized.voiceSummary.length>220)throw new Error('语音简版超过 220 字。');
  return normalized;
}

export async function requestInitialReading(provider,input){if(typeof provider?.generateReading!=='function')throw new Error('解读接口不可用。');return normalizeReading(await provider.generateReading(structuredClone(input)),input);}
export async function requestFollowUp(provider,input,session,question){
  const prompt=clean(question);if(!prompt||prompt.length>maxFollowUpLength)throw new Error(`追问需为 1–${maxFollowUpLength} 个字符。`);if(typeof provider?.answerFollowUp!=='function')throw new Error('追问接口不可用。');
  const answer=clean(await provider.answerFollowUp({input:structuredClone(input),firstReading:structuredClone(session.firstReading),history:structuredClone(session.followUps),question:prompt}));if(!answer)throw new Error('追问接口没有返回内容。');return {question:prompt,answer};
}
export function createReadingSession(input,reading,provider='mock-local-v2',createdAt=new Date().toISOString()){return {version:1,fingerprint:readingFingerprint(input),provider,createdAt,firstReading:normalizeReading(reading,input),followUps:[]};}
export function appendFollowUp(session,turn){if(!session||!clean(turn?.question)||!clean(turn?.answer))throw new Error('追问记录无效。');return {...session,followUps:[...session.followUps,{question:clean(turn.question),answer:clean(turn.answer)}].slice(-maxFollowUps)};}
export function restoreReadingSession(raw,input){try{const value=JSON.parse(raw);if(value?.version!==1||value.fingerprint!==readingFingerprint(input)||!clean(value.provider)||!clean(value.createdAt))return null;const firstReading=normalizeReading(value.firstReading,input),followUps=Array.isArray(value.followUps)?value.followUps.map(item=>({question:clean(item?.question),answer:clean(item?.answer)})).filter(item=>item.question&&item.answer).slice(-maxFollowUps):[];return {...value,firstReading,followUps};}catch{return null;}}

function patternSummary(input,patterns){
  const notes=[];
  if(patterns.majorCount>=Math.ceil(input.cards.length/2))notes.push('大阿尔卡纳占比较高，问题更像一次方向或身份层面的调整');
  if(patterns.dominantDomain)notes.push(`${patterns.dominantDomain}成为牌阵的主声部`);
  if(patterns.reversedCount>patterns.uprightCount)notes.push('逆位较多，能量更偏向内在整理、延迟与校准');
  if(patterns.repeatedRanks.length)notes.push(`${joinNatural(patterns.repeatedRanks)}重复出现，提示同一发展阶段正在不同领域回响`);
  return notes.length?`${joinNatural(notes)}。`:'牌面没有单一元素压倒其他部分，重点在于各位置之间如何彼此修正。';
}
function interpretMockCard(card,index){
  const meaning=card.orientation==='reversed'?card.knowledge.reversed:card.knowledge.upright;
  const openings=[`${card.position}并不是单独评价这张牌的好坏。`,`${card.position}把${card.name}放进了一个具体语境。`,`在${card.position}，${card.name}更像一面观察局面的镜子。`];
  return `${openings[index%openings.length]}${card.positionLens}${meaning} 这里的关键不是立刻证明“${firstKeyword(card)}”是否会发生，而是看它已经以什么形式出现在现实里。${card.knowledge.counsel}`;
}

export const mockReadingProvider={
  id:'mock-local-v2',label:'专业知识模拟接口',
  async generateReading(input){
    const patterns=analyzeReadingPatterns(input),question=clip(input.question,48),first=input.cards[0],last=input.cards.at(-1),single=input.cards.length===1;
    const cardReadings=input.cards.map((card,index)=>({position:card.position,card:card.name,orientation:card.orientation,interpretation:interpretMockCard(card,index)}));
    const journey=input.cards.map(card=>`${card.position}的${card.name}${orientationLabel(card.orientation)}`).join('，继而来到');
    const guidance=[first.knowledge.counsel,patterns.reversedCount?'把受阻处写成“我能验证什么、我能调整什么”两栏。':'把已经确认的事实与仍在推测的部分分开写下。','在 24 小时内完成一个能验证当前判断的小动作。'];
    const synthesis=single?`${first.name}${orientationLabel(first.orientation)}没有替你给出“会”或“不会”的答案。它把焦点收回到“${firstKeyword(first)}”如何真实发生：哪些感受或机会已经出现，哪些仍需要条件与回应。先从“${first.knowledge.archetype}”这一原型看清眼前的一件事实，再决定一个能被现实检验的动作。牌面提供的是视角，不替你决定，也不替代专业意见。`:`牌阵的行进是：${journey}。${first.name}提出的起点与${last.name}给出的落点之间，并非简单的吉凶变化，而是从“${firstKeyword(first)}”转向“${firstKeyword(last)}”的选择过程。结合你的问题，最值得留意的是：哪些部分已有现实证据，哪些仍只是期待或担忧。牌面提供的是可检验的视角，不替你决定，也不替代法律、医疗、财务或心理等专业意见。`;
    const voice=single?`关于“${question}”，${first.name}${orientationLabel(first.orientation)}把焦点放在${firstKeyword(first)}。它不替你预言结果，而是请你借助“${first.knowledge.archetype}”的视角看清已经出现的信号。${first.knowledge.counsel}`:`关于“${question}”，这组${input.spread.name}从${first.name}${orientationLabel(first.orientation)}走向${last.name}${orientationLabel(last.orientation)}。主线不是预言结果，而是看见${firstKeyword(first)}如何发展为${firstKeyword(last)}。先借助“${first.knowledge.archetype}”的视角看清起点，再用“${last.knowledge.archetype}”的提醒完成下一步。`;
    return {title:`${input.spread.name} · 牌阵叙事`,overview:`你问的是“${question}”。这次解读会把 ${input.cards.length} 张牌放回具体位置，并观察它与问题的真实联系。${patternSummary(input,patterns)}`,cardReadings,synthesis,guidance,voiceSummary:clip(voice,200)};
  },
  async answerFollowUp({input,history,question}){
    const lowered=question.toLowerCase(),matched=input.cards.find(card=>[card.name,card.position,...card.keywords.split(' · ')].some(word=>lowered.includes(word.toLowerCase()))),anchor=matched||input.cards[history.length%input.cards.length],meaning=anchor.orientation==='reversed'?anchor.knowledge.reversed:anchor.knowledge.upright;
    return `把追问“${clip(question,72)}”放回原牌阵，最适合继续深挖的是${anchor.position}的${anchor.name}${orientationLabel(anchor.orientation)}。${anchor.positionLens}${meaning} 因此，与其新增一张牌来寻找确定答案，不如先核对：现实里有什么证据支持这个判断，什么信息仍缺失？${anchor.knowledge.counsel} 本回答沿用已锁定的问题、卡牌、位置和正逆位，没有重新抽牌。`;
  }
};

async function postReading(type,payload){const response=await fetch('/api/readings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type,...payload})});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(clean(body.error)||`服务端返回 ${response.status}`);return body.result;}
export const apiReadingProvider={id:'server-api-v1',label:'安全服务端 AI 接口',generateReading:input=>postReading('initial',{input}),answerFollowUp:payload=>postReading('follow-up',payload)};
