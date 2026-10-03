import {cards,spreads,spreadPositions,cardOrientation} from './core.mjs?v=0.6.2';
import {tarotKnowledgeVersion,getCardKnowledge,getPositionLens,analyzeReadingPatterns} from './tarot-knowledge.mjs?v=0.8.0';

export const readingSchemaVersion='tarot-reading-v2';
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
  const cardReadings=Array.isArray(value.cardReadings)?value.cardReadings.map((item,index)=>({
    position:input.cards[index]?.position,
    card:input.cards[index]?.name,
    orientation:input.cards[index]?.orientation,
    visualReading:clean(item?.visualReading),
    baseMeaning:clean(item?.baseMeaning),
    contextualReading:clean(item?.contextualReading)
  })):[];
  const flow={movement:clean(value.flow?.movement),tension:clean(value.flow?.tension),direction:clean(value.flow?.direction)};
  const guidance=Array.isArray(value.guidance)?value.guidance.map(clean).filter(Boolean):[];
  const normalized={title:clean(value.title),overview:clean(value.overview),cardReadings,flow,synthesis:clean(value.synthesis),guidance,voiceSummary:clean(value.voiceSummary)};
  const incompleteCard=cardReadings.some(item=>!item.visualReading||!item.baseMeaning||!item.contextualReading);
  if(!normalized.title||!normalized.overview||cardReadings.length!==input.cards.length||incompleteCard||!flow.movement||!flow.tension||!flow.direction||!normalized.synthesis||!guidance.length||!normalized.voiceSummary)throw new Error('解读接口缺少必要字段。');
  if(normalized.voiceSummary.length>220)throw new Error('语音简版超过 220 字。');
  return normalized;
}

export async function requestInitialReading(provider,input){if(typeof provider?.generateReading!=='function')throw new Error('解读接口不可用。');return normalizeReading(await provider.generateReading(structuredClone(input)),input);}
export async function requestFollowUp(provider,input,session,question){
  const prompt=clean(question);if(!prompt||prompt.length>maxFollowUpLength)throw new Error(`追问需为 1–${maxFollowUpLength} 个字符。`);if(typeof provider?.answerFollowUp!=='function')throw new Error('追问接口不可用。');
  const answer=clean(await provider.answerFollowUp({input:structuredClone(input),firstReading:structuredClone(session.firstReading),history:structuredClone(session.followUps),question:prompt}));if(!answer)throw new Error('追问接口没有返回内容。');return {question:prompt,answer};
}
export function createReadingSession(input,reading,provider='mock-local-v3',createdAt=new Date().toISOString()){return {version:2,fingerprint:readingFingerprint(input),provider,createdAt,firstReading:normalizeReading(reading,input),followUps:[]};}
export function appendFollowUp(session,turn){if(!session||!clean(turn?.question)||!clean(turn?.answer))throw new Error('追问记录无效。');return {...session,followUps:[...session.followUps,{question:clean(turn.question),answer:clean(turn.answer)}].slice(-maxFollowUps)};}
export function restoreReadingSession(raw,input){try{const value=JSON.parse(raw);if(value?.version!==2||value.fingerprint!==readingFingerprint(input)||!clean(value.provider)||!clean(value.createdAt))return null;const firstReading=normalizeReading(value.firstReading,input),followUps=Array.isArray(value.followUps)?value.followUps.map(item=>({question:clean(item?.question),answer:clean(item?.answer)})).filter(item=>item.question&&item.answer).slice(-maxFollowUps):[];return {...value,firstReading,followUps};}catch{return null;}}

function patternSummary(input,patterns){
  const notes=[];
  if(patterns.majorCount>=Math.ceil(input.cards.length/2))notes.push('大阿尔卡纳占比较高，问题更像一次方向或身份层面的调整');
  if(patterns.dominantDomain)notes.push(`${patterns.dominantDomain}成为牌阵的主声部`);
  if(patterns.reversedCount>patterns.uprightCount)notes.push('逆位较多，能量更偏向内在整理、延迟与校准');
  if(patterns.repeatedRanks.length)notes.push(`${joinNatural(patterns.repeatedRanks)}重复出现，提示同一发展阶段正在不同领域回响`);
  return notes.length?`${notes.join('；')}。`:'牌面没有单一元素压倒其他部分，重点在于各位置之间如何彼此修正。';
}

function questionContext(question){
  const contexts=[
    {pattern:/工作|职业|岗位|同事|领导|升职|薪资|项目|offer|创业|上班/i,name:'工作',focus:'职责、资源、选择成本与真实推进',check:'用岗位事实、可交付成果和身体感受交叉验证'},
    {pattern:/感情|关系|伴侣|对象|恋爱|婚姻|复合|朋友|家人/i,name:'关系',focus:'双方表达、边界、期待与互动循环',check:'区分对方实际行为、你的感受和未经确认的猜测'},
    {pattern:/钱|收入|支出|投资|理财|财务|买|卖/i,name:'财务',focus:'资源、安全边界、风险与长期承受力',check:'先核对数字、时间成本与最坏情况下的承受范围'},
    {pattern:/学习|考试|成长|方向|选择|未来|规划/i,name:'成长',focus:'动机、能力积累、路径选择与反馈',check:'用一次小规模行动检验方向，而不是只凭想象决定'}
  ];
  return contexts.find(item=>item.pattern.test(question))||{name:'当前',focus:'事实、感受、选择与可能后果',check:'把已经发生的事实和仍在推测的部分分开'};
}

function interpretMockCard(card,context){
  const meaning=card.orientation==='reversed'?card.knowledge.reversed:card.knowledge.upright;
  return {
    position:card.position,
    card:card.name,
    orientation:card.orientation,
    visualReading:`牌面上，${card.knowledge.visuals.join('；')}。这些元素先把注意力放在“${card.knowledge.archetype}”所代表的经验上。`,
    baseMeaning:`${card.name}${orientationLabel(card.orientation)}：${meaning}`,
    contextualReading:`放在“${card.position}”这个位置，${card.positionLens}结合你的${context.name}问题，它更具体地指向${context.focus}里与“${firstKeyword(card)}”有关的部分。${context.check}，再决定是否采用这张牌的提醒：${card.knowledge.counsel}`
  };
}

export const mockReadingProvider={
  id:'mock-local-v3',label:'视觉线索模拟接口',
  async generateReading(input){
    const patterns=analyzeReadingPatterns(input),context=questionContext(input.question),question=clip(input.question,48),first=input.cards[0],last=input.cards.at(-1),single=input.cards.length===1;
    const cardReadings=input.cards.map(card=>interpretMockCard(card,context));
    const journey=input.cards.map(card=>`${card.position}的${card.name}${orientationLabel(card.orientation)}（${firstKeyword(card)}）`).join(' → ');
    const tension=single?`${firstKeyword(first)}想要被看见，但${first.orientation==='reversed'?'它目前更像内在卡点或尚未成熟的条件':'真正的难点在于如何把理解落实为选择'}。`:`牌阵的核心矛盾是：${firstKeyword(first)}所代表的起点，如何走向${firstKeyword(last)}所代表的落点。${patterns.reversedCount?`${patterns.reversedCount} 张逆位提示其中有延迟、内耗或条件未齐。`:'主要阻力不在缺少能量，而在是否愿意持续行动。'}`;
    const direction=single?`如果能${context.check}，这张牌的正向资源更容易落地；如果只把牌义当作确定答案，原有盲点仍会保留。`:`若沿用当前反应，局面会继续强化“${firstKeyword(last)}”的阴影面；若在当下调整${context.focus}，未来位置呈现的资源就更可能被建设性地使用。这是条件性趋势，不是固定预言。`;
    const flow={movement:single?`${first.name}把问题集中到“${firstKeyword(first)}”：先看牌面事实，再辨认它在现实中的对应。`:`完整流动为 ${journey}。它描述的是能量如何转换，而不是把每张牌拆成互不相干的结论。`,tension,direction};
    const guidance=[first.knowledge.counsel,`${context.check}，写下一条支持证据和一条反证。`,'在 24 小时内完成一个能验证当前判断的小动作，再根据反馈调整。'];
    const synthesis=single?`这张牌没有替你给出“会”或“不会”。牌面视觉、${orientationLabel(first.orientation)}牌义与${context.name}语境共同指向：先看清“${firstKeyword(first)}”已经怎样出现在现实里，再选择一个可验证的动作。现实检验比追求绝对答案更重要。`:`这组${input.spread.name}不是${input.cards.length}条孤立解释，而是一条从${firstKeyword(first)}走向${firstKeyword(last)}的路径。${patternSummary(input,patterns)}结合你的${context.name}问题，决定走向的不是单张牌的吉凶，而是你能否在核心矛盾出现时，用现实检验修正当前选择。`;
    const voice=single?`关于“${question}”，${first.name}${orientationLabel(first.orientation)}先请你看见${firstKeyword(first)}。${context.check}，然后用一个小动作验证判断。`:`关于“${question}”，牌阵从${firstKeyword(first)}走向${firstKeyword(last)}。${tension}先${context.check}，再做一个可验证的小动作。`;
    return {title:`${input.spread.name} · ${context.name}解读`,overview:`你问的是“${question}”。本次按“牌面线索 → 基础牌义 → 结合问题 → 完整流动”的顺序解读，并保持所有卡牌、位置和正逆位不变。`,cardReadings,flow,synthesis,guidance,voiceSummary:clip(voice,200)};
  },
  async answerFollowUp({input,history,question}){
    const lowered=question.toLowerCase(),matched=input.cards.find(card=>[card.name,card.position,...card.keywords.split(' · ')].some(word=>lowered.includes(word.toLowerCase()))),anchor=matched||input.cards[history.length%input.cards.length],meaning=anchor.orientation==='reversed'?anchor.knowledge.reversed:anchor.knowledge.upright,context=questionContext(input.question);
    return `回到原牌阵，最相关的是${anchor.position}的${anchor.name}${orientationLabel(anchor.orientation)}。牌面上，${anchor.knowledge.visuals[0]}；这使“${firstKeyword(anchor)}”成为追问的观察入口。${anchor.positionLens}${meaning} 针对你的${context.name}问题，先${context.check}，再执行：${anchor.knowledge.counsel} 本回答沿用已锁定的问题、卡牌、位置和正逆位，没有重新抽牌。`;
  }
};

async function postReading(type,payload){const response=await fetch('/api/readings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type,...payload})});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(clean(body.error)||`服务端返回 ${response.status}`);return body.result;}
export const apiReadingProvider={id:'server-api-v2',label:'安全服务端 AI 接口',generateReading:input=>postReading('initial',{input}),answerFollowUp:payload=>postReading('follow-up',payload)};
