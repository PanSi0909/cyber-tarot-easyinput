export const learningStateVersion=1;
export const maxLearningDraftLength=500;

export function freshLearning(){
  return {active:false,index:0,detailOpen:false,draft:'',confirmed:false,returnScroll:0};
}

function boundedIndex(value,total){return Number.isInteger(value)&&value>=0&&value<total?value:0;}

export function restoreLearning(raw,total=78){
  try{
    const saved=JSON.parse(raw),base=freshLearning();
    if(saved?.version!==learningStateVersion)return base;
    return {...base,active:saved.active===true,index:boundedIndex(saved.index,total),detailOpen:saved.active===true&&saved.detailOpen===true,returnScroll:Number.isFinite(saved.returnScroll)&&saved.returnScroll>=0?saved.returnScroll:0};
  }catch{return freshLearning();}
}

export function serializeLearning(state){
  return JSON.stringify({version:learningStateVersion,active:state.active===true,index:state.index,detailOpen:state.detailOpen===true,returnScroll:state.returnScroll});
}

export function learningTransition(state,action,total=78){
  if(action==='toggle')return state.active?{...freshLearning(),index:boundedIndex(state.index,total)}:{...freshLearning(),active:true,index:boundedIndex(state.index,total),returnScroll:Number.isFinite(state.returnScroll)?state.returnScroll:0};
  if(!state.active)return state;
  if(action==='left'||action==='right')return {...state,index:(state.index+(action==='left'?-1:1)+total)%total,detailOpen:false,draft:'',confirmed:false};
  if(action==='confirm')return state.detailOpen?state:{...state,detailOpen:true};
  if(action==='clear')return state.draft||state.confirmed?{...state,draft:'',confirmed:false}:state;
  if(action==='submit')return !state.detailOpen||state.confirmed||!state.draft.trim()?state:{...state,confirmed:true};
  if(action?.type==='set-draft'&&state.detailOpen&&!state.confirmed){
    const draft=String(action.value??'').slice(0,maxLearningDraftLength);
    return draft===state.draft?state:{...state,draft};
  }
  if(action?.type==='set-return-scroll'){
    const returnScroll=Number.isFinite(action.value)&&action.value>=0?action.value:0;
    return returnScroll===state.returnScroll?state:{...state,returnScroll};
  }
  return state;
}

function fragments(value){return String(value||'').split(/[，。、“”‘’；：·\s]+/).map(item=>item.trim()).filter(item=>item.length>=2);}

export function compareLearningInterpretation(draft,card,knowledge){
  const answer=String(draft||'').trim();
  const reference=[card?.keywords,knowledge?.archetype,knowledge?.element,knowledge?.domain,knowledge?.upright,knowledge?.reversed].flatMap(fragments);
  const similar=[...new Set(reference.filter(term=>answer.includes(term)))].slice(0,5);
  const missedVisuals=(knowledge?.visuals||[]).filter(visual=>!fragments(visual).some(term=>answer.includes(term))).slice(0,3);
  return {
    similar:similar.length?`你提到的“${similar.join('、')}”与参考线索直接呼应。`:'你的表达暂未与参考关键词直接重合；这不代表理解错误，可以继续从画面证据核对。',
    missedVisuals:missedVisuals.length?missedVisuals:['主要视觉线索已经被你的描述覆盖。'],
    orientationDifference:`正位：${knowledge.upright} 逆位：${knowledge.reversed}`,
    nextQuestion:knowledge.reflection
  };
}
