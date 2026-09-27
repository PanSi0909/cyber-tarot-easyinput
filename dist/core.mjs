export const cards = [
  {id:'star',number:'XVII',name:'星星',en:'THE STAR',keywords:'希望 · 修复 · 长远的方向',text:'不必在今天证明所有可能。把注意力放回那件仍让你愿意尝试的小事，给它一点稳定的时间。方向往往在持续行动中变得清晰。',question:'如果只前进一小步，你今天愿意做什么？'},
  {id:'moon',number:'XVIII',name:'月亮',en:'THE MOON',keywords:'直觉 · 模糊 · 观察',text:'眼前的信息可能还不完整。允许自己暂时没有答案，分清已经发生的事与脑海里的推测。先观察，再决定下一步。',question:'此刻的担心，有哪些来自事实，哪些来自想象？'},
  {id:'sun',number:'XIX',name:'太阳',en:'THE SUN',keywords:'清晰 · 活力 · 分享',text:'留意已经做成的事，以及愿意支持你的人。把想法表达得更直接一些，让简单、具体的行动带来新的反馈。',question:'你可以把哪一份小小的进展分享出去？'},
  {id:'fool',number:'0',name:'愚者',en:'THE FOOL',keywords:'出发 · 好奇 · 尝试',text:'新的开始不必等到准备完美。选择一个成本小、可以回头的尝试，让真实体验替你回答一部分疑问。',question:'你想尝试却一直延后的那件小事是什么？'},
  {id:'hermit',number:'IX',name:'隐者',en:'THE HERMIT',keywords:'专注 · 独处 · 内在的声音',text:'暂时放低外界的音量，把精力留给真正重要的一个问题。慢下来不是停滞，而是为自己的选择留出空间。',question:'如果不需要回应别人的期待，你会怎样选择？'}
];
export const maxQuestionLength=280;
export function recognitionFailureMessage(error){return ({
  'not-allowed':'未获得麦克风权限，请改用文字输入。',
  'service-not-allowed':'浏览器已阻止语音识别服务，请改用文字输入。',
  'audio-capture':'没有找到可用麦克风，请改用文字输入。',
  'no-speech':'没有识别到语音，请重试或改用文字输入。',
  network:'语音识别服务暂时不可用，请改用文字输入。'
})[error]||'语音识别失败，请改用文字输入。';}
export const fresh = () => ({phase:'idle',deck:[],selected:0,result:null,question:null});
export function shuffled(random=Math.random){const deck=cards.map(c=>c.id);for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}
export function transition(state,action,random=Math.random){
  if(action==='reset') return fresh();
  if(action?.type==='set-question'){
    const question=typeof action.value==='string'?action.value.trim():'';
    if(!question||question.length>maxQuestionLength||question===state.question)return state;
    return {...state,question};
  }
  if(action==='start'&&state.phase==='idle') return {...state,phase:'selecting',deck:shuffled(random),selected:2,result:null};
  if(state.phase!=='selecting') return state;
  if(action==='left'||action==='right') return {...state,selected:(state.selected+(action==='left'?-1:1)+cards.length)%cards.length};
  if(Number.isInteger(action)&&action>=0&&action<cards.length) return {...state,selected:action};
  if(action==='confirm') return {...state,phase:'revealed',result:state.deck[state.selected]};
  return state;
}
export function restore(raw){try{const s=JSON.parse(raw);const question=s.question==null?null:typeof s.question==='string'&&s.question.trim()&&s.question.trim().length<=maxQuestionLength?s.question.trim():undefined;if(question===undefined)return fresh();if(s.phase==='idle')return {...fresh(),question};if(!['selecting','revealed'].includes(s.phase)||!Array.isArray(s.deck)||s.deck.length!==cards.length||new Set(s.deck).size!==cards.length||s.deck.some(id=>!cards.some(c=>c.id===id))||!Number.isInteger(s.selected)||s.selected<0||s.selected>=cards.length)return fresh();if(s.phase==='revealed'&&s.result!==s.deck[s.selected])return fresh();return {phase:s.phase,deck:[...s.deck],selected:s.selected,result:s.phase==='revealed'?s.result:null,question};}catch{return fresh();}}
export function keyInput(event,held){
  const code=event.code;
  const monitored=/^(Digit|Numpad)[1-8]$/.test(code)||['ArrowLeft','ArrowRight','Enter','NumpadEnter'].includes(code);
  if(!monitored||event.isComposing||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return null;
  if(event.repeat||held.has(code))return {code,duplicate:true};
  held.add(code);
  const action=code==='Digit1'||code==='Numpad1'?'start':code==='Digit3'||code==='Numpad3'?'question':code==='ArrowLeft'?'left':code==='ArrowRight'?'right':code==='Enter'||code==='NumpadEnter'?'confirm':null;
  return {code,duplicate:false,action};
}
