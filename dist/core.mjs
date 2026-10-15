const majorSeeds=[
  ['fool','0','愚者','THE FOOL','新的开始 · 冒险 · 自由'],['magician','I','魔术师','THE MAGICIAN','创造力 · 意志力 · 技艺'],['high-priestess','II','女祭司','THE HIGH PRIESTESS','直觉 · 神秘 · 潜意识'],['empress','III','女皇','THE EMPRESS','丰盛 · 孕育 · 自然'],['emperor','IV','皇帝','THE EMPEROR','权威 · 结构 · 秩序'],['hierophant','V','教皇','THE HIEROPHANT','传统 · 教导 · 信仰'],['lovers','VI','恋人','THE LOVERS','关系 · 选择 · 和谐'],['chariot','VII','战车','THE CHARIOT','决心 · 胜利 · 意志'],['strength','VIII','力量','STRENGTH','勇气 · 温柔 · 坚韧'],['hermit','IX','隐者','THE HERMIT','独处 · 内省 · 智慧'],['wheel','X','命运之轮','WHEEL OF FORTUNE','循环 · 转折 · 命运'],['justice','XI','正义','JUSTICE','公正 · 因果 · 平衡'],['hanged-man','XII','倒吊人','THE HANGED MAN','停顿 · 放下 · 转换视角'],['death','XIII','死神','DEATH','终结 · 蜕变 · 释放'],['temperance','XIV','节制','TEMPERANCE','平衡 · 调和 · 耐心'],['devil','XV','恶魔','THE DEVIL','束缚 · 执着 · 阴影'],['tower','XVI','高塔','THE TOWER','崩塌 · 顿悟 · 解放'],['star','XVII','星星','THE STAR','希望 · 信念 · 疗愈'],['moon','XVIII','月亮','THE MOON','直觉 · 潜意识 · 模糊'],['sun','XIX','太阳','THE SUN','喜悦 · 成就 · 活力'],['judgement','XX','审判','JUDGEMENT','觉醒 · 召唤 · 释怀'],['world','XXI','世界','THE WORLD','完成 · 圆满 · 整合']
];
const rankSeeds=[['ace','一','ACE'],['two','二','TWO'],['three','三','THREE'],['four','四','FOUR'],['five','五','FIVE'],['six','六','SIX'],['seven','七','SEVEN'],['eight','八','EIGHT'],['nine','九','NINE'],['ten','十','TEN'],['page','侍从','PAGE'],['knight','骑士','KNIGHT'],['queen','王后','QUEEN'],['king','国王','KING']];
const suits=[
  {id:'wands',name:'权杖',en:'WANDS',symbol:'│',theme:'行动与创造',keywords:['灵感 · 潜力 · 开始','计划 · 发现 · 选择','探索 · 远见 · 领导','稳定 · 和谐 · 庆祝','竞争 · 冲突 · 挑战','胜利 · 进展 · 认可','坚持 · 防守 · 挑战','行动 · 速度 · 发展','毅力 · 防御 · 准备','负担 · 责任 · 压力','探索 · 热情 · 消息','行动 · 冒险 · 热情','自信 · 创造 · 独立','领导 · 远见 · 创造']},
  {id:'cups',name:'圣杯',en:'CUPS',symbol:'◡',theme:'情感与关系',keywords:['情感 · 直觉 · 开始','合作 · 联结 · 吸引','庆祝 · 友情 · 社群','沉思 · 平静 · 内省','失望 · 悲伤 · 遗憾','怀旧 · 回忆 · 重聚','选择 · 幻想 · 机会','离开 · 转变 · 追寻','满足 · 幸福 · 心愿','和谐 · 家庭 · 完满','感性 · 创意 · 消息','浪漫 · 魅力 · 追求','关爱 · 同理 · 支持','平衡 · 包容 · 外交']},
  {id:'swords',name:'宝剑',en:'SWORDS',symbol:'†',theme:'思考与决断',keywords:['真理 · 突破 · 新思维','选择 · 平衡 · 决定','心痛 · 失落 · 诚实','休息 · 恢复 · 沉淀','冲突 · 竞争 · 代价','过渡 · 改变 · 旅程','策略 · 秘密 · 独行','限制 · 困境 · 视角','焦虑 · 恐惧 · 压力','结束 · 低谷 · 重启','好奇 · 学习 · 新想法','行动 · 勇气 · 变革','独立 · 清晰 · 智慧','理智 · 权威 · 真理']},
  {id:'pentacles',name:'星币',en:'PENTACLES',symbol:'⬟',theme:'现实与资源',keywords:['机会 · 繁荣 · 开始','平衡 · 适应 · 安排','技能 · 合作 · 品质','安全 · 保守 · 边界','困难 · 匮乏 · 孤立','给予 · 接受 · 公平','耐心 · 坚持 · 发展','技能 · 细节 · 专注','独立 · 自足 · 收获','财富 · 安全 · 传统','学习 · 实践 · 机会','效率 · 责任 · 稳定','富足 · 安全 · 实用','成果 · 经营 · 成功']}
];
const makeCard=(card,category,symbol)=>{const first=card.keywords.split(' · ')[0];return {...card,category,symbol,text:`这张牌把注意力带向${card.keywords.replaceAll(' · ','、')}。结合你的问题，先辨认最清晰的事实，再决定一个可以落实的小步骤。`,question:`如果把“${first}”当作线索，你此刻最需要看清什么？`};};
export const cards=[
  ...majorSeeds.map(([id,number,name,en,keywords])=>makeCard({id:`major-${id}`,number,name,en,keywords},'大阿尔卡纳','✦')),
  ...suits.flatMap(suit=>rankSeeds.map(([id,rank,en],index)=>makeCard({id:`${suit.id}-${id}`,number:`${String(index+1).padStart(2,'0')} / 14`,name:`${suit.name}${rank}`,en:`${en} OF ${suit.en}`,keywords:suit.keywords[index],theme:suit.theme},suit.name,suit.symbol)))
];
export const maxQuestionLength=280;
export const currentDeckChoice='rws-78';
export const currentSpreadChoice='one-card';
const legacyCardIds={star:'major-star',moon:'major-moon',sun:'major-sun',fool:'major-fool',hermit:'major-hermit'};
export const spreads=[
  {id:'one-card',count:1,name:'单卡指引',en:'DAILY',description:'最轻的占卜结构，适合每日一抽或提取核心信号。'},
  {id:'time-flow',count:3,name:'时间之流',en:'TIME-FLOW',description:'过去、现在、未来。看见一件事的来龙去脉。'},
  {id:'choice',count:5,name:'命运抉择',en:'CHOICE',description:'比较两条路径、代价，以及各自可能带来的结果。'},
  {id:'celtic-cross',count:10,name:'凯尔特十字',en:'CELTIC',description:'完整展开处境、阻碍、潜意识、外部影响与趋势。'}
];
export const spreadPositions={
  'one-card':['核心'],
  'time-flow':['过去','现在','未来'],
  choice:['现状','路径 A','路径 A 结果','路径 B','路径 B 结果'],
  'celtic-cross':['现状','挑战','根基','过去','可能','未来','自我','环境','希望与恐惧','结果']
};
export function fixedTextAction(value){
  const normalized=typeof value==='string'?value.replaceAll(/\s/g,''):'';
  if(['返回','S8返回'].includes(normalized))return 'back';
  if(['周期洞察','S7周期洞察'].includes(normalized))return 'insights';
  if(['学习模式','S6学习模式'].includes(normalized))return 'learning';
  if(['历史备份','S5历史备份'].includes(normalized))return 'history';
  if(normalized.endsWith('综合解读'))return 'reading';
  if(normalized.endsWith('牌阵选择')||normalized.endsWith('牌组选择'))return 'setup';
  return normalized.endsWith('开始')?'start':null;
}
export function canReceiveHardwareText(state){
  const phase=state?.phase;
  return ['idle','configuring','spread-selecting','revealed'].includes(phase)||(phase==='selecting'&&Boolean(state.question));
}
export function recognitionFailureMessage(error){return ({
  'not-allowed':'未获得麦克风权限，请改用文字输入。',
  'service-not-allowed':'浏览器已阻止语音识别服务，请改用文字输入。',
  'audio-capture':'没有找到可用麦克风，请改用文字输入。',
  'no-speech':'没有识别到语音，请重试或改用文字输入。',
  network:'语音识别服务暂时不可用，请改用文字输入。'
})[error]||'语音识别失败，请改用文字输入。';}
export const fresh = () => ({phase:'idle',deck:[],orientations:[],selected:0,result:null,results:[],picked:[],question:null,deckChoice:null,spreadChoice:null,spreadIndex:0});
export function shuffled(random=Math.random){const deck=cards.map(c=>c.id);for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}
function preparedDeck(random=Math.random){const deck=shuffled(random),orientations=deck.map(()=>random()<0.35?'reversed':'upright');return {deck,orientations};}
export function cardOrientation(state,cardId){const index=state.deck.indexOf(cardId);return state.orientations[index]==='reversed'?'reversed':'upright';}
function spreadFor(state){return spreads.find(spread=>spread.id===state.spreadChoice);}
function nextAvailable(state,direction){
  let selected=state.selected;
  for(let i=0;i<state.deck.length;i++){
    selected=(selected+direction+state.deck.length)%state.deck.length;
    if(!state.picked.includes(state.deck[selected]))return selected;
  }
  return state.selected;
}
export function transition(state,action,random=Math.random){
  if(action==='reset') return fresh();
  if(action==='back'){
    if(state.phase==='configuring')return fresh();
    if(state.phase==='spread-selecting')return {...fresh(),phase:'configuring'};
    if(state.phase==='selecting'&&!state.question)return {...fresh(),phase:'spread-selecting',spreadIndex:state.spreadIndex};
    return state;
  }
  if(action?.type==='set-question'){
    if(state.phase!=='selecting')return state;
    const question=typeof action.value==='string'?action.value.trim():'';
    if(!question||question.length>maxQuestionLength||question===state.question)return state;
    return {...state,question};
  }
  if(action==='start'&&(state.phase==='idle'||state.phase==='revealed')) return {...fresh(),phase:'configuring'};
  if(action==='setup'&&state.phase==='configuring')return {...state,phase:'spread-selecting'};
  if(state.phase==='spread-selecting'){
    if(action==='left'||action==='right')return {...state,spreadIndex:(state.spreadIndex+(action==='left'?-1:1)+spreads.length)%spreads.length};
    if(Number.isInteger(action)&&action>=0&&action<spreads.length)return {...state,spreadIndex:action};
    if(action==='confirm'){
      const spread=spreads[state.spreadIndex],prepared=preparedDeck(random);
      return {...state,phase:'selecting',...prepared,selected:0,result:null,results:[],picked:[],deckChoice:currentDeckChoice,spreadChoice:spread.id};
    }
    return state;
  }
  if(action?.type==='set-setup'&&(state.phase==='configuring'||state.phase==='spread-selecting')){
    const spreadIndex=spreads.findIndex(spread=>spread.id===action.spread);
    if(action.deck!==currentDeckChoice||spreadIndex<0)return state;
    return {...state,phase:'selecting',...preparedDeck(random),selected:0,result:null,results:[],picked:[],deckChoice:action.deck,spreadChoice:action.spread,spreadIndex};
  }
  if(state.phase!=='selecting') return state;
  if(action==='left'||action==='right') return {...state,selected:nextAvailable(state,action==='left'?-1:1)};
  if(Number.isInteger(action)&&action>=0&&action<cards.length&&!state.picked.includes(state.deck[action])) return {...state,selected:action};
  if(action==='confirm'){
    const pickedId=state.deck[state.selected],spread=spreadFor(state);
    if(!state.question||!spread||state.picked.includes(pickedId))return state;
    const picked=[...state.picked,pickedId];
    if(picked.length===spread.count)return {...state,phase:'revealed',result:picked[0],results:picked,picked};
    return {...state,picked,selected:nextAvailable({...state,picked},1)};
  }
  return state;
}
export function restore(raw){try{
  const s=JSON.parse(raw),base=fresh();
  const question=s.question==null?null:typeof s.question==='string'&&s.question.trim()&&s.question.trim().length<=maxQuestionLength?s.question.trim():undefined;
  if(question===undefined)return base;
  if(s.phase==='idle')return {...base,question};
  if(s.phase==='configuring')return {...base,phase:'configuring',question};
  if(s.phase==='spread-selecting')return {...base,phase:'spread-selecting',question,spreadIndex:Number.isInteger(s.spreadIndex)&&s.spreadIndex>=0&&s.spreadIndex<spreads.length?s.spreadIndex:0};
  if(Array.isArray(s.deck)&&s.deck.length===5&&new Set(s.deck).size===5&&s.deck.every(id=>legacyCardIds[id])){
    if(!['selecting','revealed'].includes(s.phase)||!Number.isInteger(s.selected)||s.selected<0||s.selected>=s.deck.length)return base;
    const legacyDeck=s.deck.map(id=>legacyCardIds[id]),deck=[...legacyDeck,...cards.map(card=>card.id).filter(id=>!legacyDeck.includes(id))];
    const orientations=deck.map(()=>'upright');
    if(s.phase==='selecting')return {...base,phase:'selecting',deck,orientations,selected:s.selected,question,deckChoice:currentDeckChoice,spreadChoice:currentSpreadChoice};
    const result=legacyCardIds[s.result];
    if(!result||result!==deck[s.selected])return base;
    return {...base,phase:'revealed',deck,orientations,selected:s.selected,result,results:[result],picked:[result],question,deckChoice:currentDeckChoice,spreadChoice:currentSpreadChoice};
  }
  if(!['selecting','revealed'].includes(s.phase)||!Array.isArray(s.deck)||s.deck.length!==cards.length||new Set(s.deck).size!==cards.length||s.deck.some(id=>!cards.some(c=>c.id===id))||!Number.isInteger(s.selected)||s.selected<0||s.selected>=cards.length)return base;
  const deckChoice=s.deckChoice??currentDeckChoice,spreadChoice=s.spreadChoice??currentSpreadChoice,spreadIndex=spreads.findIndex(spread=>spread.id===spreadChoice);
  if(deckChoice!==currentDeckChoice||spreadIndex<0)return base;
  const orientations=s.orientations==null?s.deck.map(()=>'upright'):s.orientations;
  if(!Array.isArray(orientations)||orientations.length!==s.deck.length||orientations.some(value=>!['upright','reversed'].includes(value)))return base;
  const legacyResult=s.phase==='revealed'&&typeof s.result==='string'?[s.result]:[];
  const picked=Array.isArray(s.picked)?s.picked:Array.isArray(s.results)?s.results:legacyResult;
  if(new Set(picked).size!==picked.length||picked.some(id=>!s.deck.includes(id)))return base;
  const spread=spreads[spreadIndex];
  if(picked.length>(s.phase==='revealed'?spread.count:spread.count-1)||s.phase==='revealed'&&picked.length!==spread.count)return base;
  if(s.phase==='revealed'&&s.result!=null&&s.result!==picked[0])return base;
  const results=s.phase==='revealed'?[...picked]:[];
  return {...base,phase:s.phase,deck:[...s.deck],orientations:[...orientations],selected:s.selected,result:results[0]??null,results,picked:[...picked],question,deckChoice,spreadChoice,spreadIndex};
}catch{return fresh();}}
export function keyInput(event,held){
  const code=event.code;
  const monitored=/^(Digit|Numpad)[1-8]$/.test(code)||['Escape','ArrowLeft','ArrowRight','Enter','NumpadEnter'].includes(code);
  if(!monitored||event.isComposing||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return null;
  if(event.repeat||held.has(code))return {code,duplicate:true};
  held.add(code);
  const action=code==='Digit1'||code==='Numpad1'?'start':code==='Digit2'||code==='Numpad2'?'setup':code==='Digit3'||code==='Numpad3'?'question':code==='Digit4'||code==='Numpad4'?'reading':code==='Digit5'||code==='Numpad5'?'history':code==='Digit6'||code==='Numpad6'?'learning':code==='Digit7'||code==='Numpad7'?'insights':code==='Digit8'||code==='Numpad8'||code==='Escape'?'back':code==='ArrowLeft'?'left':code==='ArrowRight'?'right':code==='Enter'||code==='NumpadEnter'?'confirm':null;
  return {code,duplicate:false,action};
}
