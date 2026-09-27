import {cards,fresh,restore,transition,keyInput,maxQuestionLength,recognitionFailureMessage} from './core.mjs?v=0.2.1';
const $=id=>document.getElementById(id);
const storageKey='cyber-tarot.v1';
const greetingKey='cyber-tarot.greeting.v1';
let state=fresh();
try{state=restore(sessionStorage.getItem(storageKey));}catch{}
let greetingPlayed=false;
try{greetingPlayed=sessionStorage.getItem(greetingKey)==='1';}catch{}
let storageAvailable=true,received=0,accepted=0,duplicates=0,logs=[];
const held=new Set(),hits=new Map(),timers=new Map();
let recognition=null,questionStatus='idle';
const deck=$('deck');
for(let i=0;i<cards.length;i++){
  const button=document.createElement('button');button.className='tarot-card';button.type='button';
  button.innerHTML=`<span class="card-symbol" aria-hidden="true">✧</span><span class="card-index" aria-hidden="true">0${i+1}</span>`;
  button.addEventListener('click',()=>dispatch(i,'鼠标／触控'));
  deck.append(button);
}
function saveState(){try{sessionStorage.setItem(storageKey,JSON.stringify(state));}catch{storageAvailable=false;}}
function setQuestionStatus(status,message){
  questionStatus=status;
  const labels={idle:'待机',listening:'正在聆听',stopped:'已停止',reviewing:'等待确认',failed:'失败'};
  for(const badge of document.querySelectorAll('.question-state')){badge.dataset.state=status;badge.textContent=labels[status];}
  $('question-status-message').textContent=message;
  $('stop-listening').disabled=status!=='listening';
}
function playGreeting(){
  if(greetingPlayed)return false;
  greetingPlayed=true;
  try{sessionStorage.setItem(greetingKey,'1');}catch{}
  const synth=window.speechSynthesis,Utterance=window.SpeechSynthesisUtterance;
  if(!synth||!Utterance){$('greeting-status').textContent='当前浏览器无法播放启动语，不影响继续使用。';return false;}
  try{
    synth.cancel();
    const utterance=new Utterance('欢迎回来。想好问题，我们开始吧。');
    utterance.lang='zh-CN';utterance.rate=1.05;utterance.pitch=1;
    utterance.onend=()=>{$('greeting-status').textContent='启动语已播放 · 本标签页只播放一次。';};
    utterance.onerror=()=>{$('greeting-status').textContent='启动语播放失败，不影响继续使用。';};
    synth.speak(utterance);
    $('greeting-status').textContent='正在播放启动语 · 本标签页只播放一次。';
    return true;
  }catch{$('greeting-status').textContent='启动语播放失败，不影响继续使用。';return false;}
}
function stopRecognition(abort=false){
  const active=recognition;
  recognition=null;
  if(!active)return;
  try{abort?active.abort():active.stop();}catch{}
}
function startRecognition(){
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition){
    setQuestionStatus('failed','当前浏览器不支持语音识别，请直接在下方输入问题。');
    $('question-draft').focus();
    return false;
  }
  stopRecognition(true);
  const active=new Recognition();
  recognition=active;
  active.lang='zh-CN';active.interimResults=true;active.continuous=false;
  active.onstart=()=>{if(recognition===active)setQuestionStatus('listening','正在聆听。说完后可停止，也可以直接修改识别文字。');};
  active.onresult=event=>{
    if(recognition!==active)return;
    let transcript='';
    for(let i=0;i<event.results.length;i++)transcript+=event.results[i][0].transcript;
    $('question-draft').value=transcript.slice(0,maxQuestionLength);
    $('confirm-question').disabled=!$('question-draft').value.trim();
    if(event.results[event.results.length-1].isFinal){
      setQuestionStatus('reviewing','识别文字可以修改；确认后才会写入本次占卜。');
      try{active.stop();}catch{}
    }else setQuestionStatus('listening','正在聆听。识别文字会实时出现，说完后可以停止。');
  };
  active.onerror=event=>{
    if(recognition!==active)return;
    recognition=null;
    setQuestionStatus('failed',recognitionFailureMessage(event.error));
    $('question-draft').focus();
  };
  active.onend=()=>{
    if(recognition!==active)return;
    recognition=null;
    if(questionStatus==='listening')setQuestionStatus($('question-draft').value.trim()?'reviewing':'stopped',$('question-draft').value.trim()?'请检查识别文字，确认后写入本次占卜。':'聆听已停止。可以重试或直接输入问题。');
  };
  try{
    active.start();
    setQuestionStatus('listening','正在请求麦克风并准备聆听。');
    return true;
  }catch{
    recognition=null;
    setQuestionStatus('failed','无法启动语音识别，请直接在下方输入问题。');
    $('question-draft').focus();
    return false;
  }
}
function openQuestion(){
  if($('question-dialog').open)return false;
  $('question-draft').value=state.question||'';
  $('confirm-question').disabled=!$('question-draft').value.trim();
  setQuestionStatus('idle','准备启动语音识别；文字输入始终可用。');
  $('question-dialog').showModal();
  startRecognition();
  return true;
}
function render(){
  const revealed=state.phase==='revealed',selecting=state.phase==='selecting';
  const result=cards.find(c=>c.id===state.result);
  deck.className=`deck ${state.phase}`;
  [...deck.children].forEach((button,i)=>{
    const selected=state.phase!=='idle'&&state.selected===i;
    button.classList.toggle('selected',selected);button.disabled=!selecting;
    button.setAttribute('aria-pressed',String(selected));
    button.setAttribute('aria-label',revealed&&selected?`本次抽到：${result.name}`:`选择第 ${i+1} 张牌`);
    button.querySelector('.card-symbol').textContent=revealed&&selected?result.name:'✧';
  });
  $('phase-label').textContent=state.phase==='idle'?'01 / 准备':selecting?'02 / 选择':'03 / 揭晓';
  $('stage-title').textContent=state.phase==='idle'?'先留一点空白':selecting?'哪一张，让你想停下？':'这一刻，它属于你。';
  $('stage-hint').textContent=state.phase==='idle'?'按下开始，让牌组为你展开。':selecting?'转动旋钮或按方向键，停在一张牌上。':'本次结果已锁定，可以安心停留。';
  $('selection-label').textContent=state.phase==='idle'?'等待开始':`第 ${state.selected+1} 张 / 共 5 张`;
  $('previous').disabled=!selecting;$('next').disabled=!selecting;
  $('main-action').disabled=revealed;$('main-label').textContent=state.phase==='idle'?'开始抽卡':selecting?'确认 · 翻开这张':'已确认';
  $('main-key').textContent=selecting?'Enter':'1';$('main-key').hidden=revealed;
  $('result-tag').textContent=revealed?'已锁定':'待揭晓';$('new-round').hidden=!revealed;
  $('current-question').textContent=state.question?`本次问题：${state.question}`:'尚未确认问题。语音识别文字只有确认后才会进入本次占卜。';
  $('current-question').classList.toggle('confirmed',Boolean(state.question));
  if(revealed){$('reading-content').innerHTML=`<div class="result-number">${result.number}</div><h2>${result.name}</h2><div class="result-en">${result.en}</div><p class="result-keywords">${result.keywords}</p><p>${result.text}</p><div class="reflection"><span>留给自己的问题</span><p>${result.question}</p></div>`;}
  else{$('reading-content').innerHTML='<div class="empty-mark" aria-hidden="true">✧</div><h2>答案，慢一点出现。</h2><p>这里将留下你抽到的牌，<br>和一段供你思考的文字。</p><div class="reading-note">这一次只抽一张。<br>确认之后，牌面与解读会固定下来。</div>';}
}
function dispatch(action,source){
  const next=transition(state,action);
  if(next===state){$('stage-message').textContent=state.phase==='revealed'?'本次结果已固定。要重抽，请使用右侧的“重新抽牌”。':state.phase==='idle'?'先按 1 或点击“开始抽卡”。':'这个按键暂未绑定抽卡动作。';return false;}
  state=next;saveState();
  render();
  $('stage-message').textContent=state.phase==='revealed'?`已抽到「${cards.find(c=>c.id===state.result).name}」。${storageAvailable?'本标签页刷新后仍保留。':'浏览器未允许保存，请勿刷新。'}`:state.phase==='selecting'?`${source} · 当前选择第 ${state.selected+1} 张`:'新的一次，按 1 开始。';
  return true;
}
function performAction(action,source){
  if(action==='start')playGreeting();
  if(action==='question')return openQuestion();
  return dispatch(action,source);
}
$('main-action').addEventListener('click',()=>performAction(state.phase==='idle'?'start':'confirm','鼠标／触控'));
$('question-action').addEventListener('click',()=>performAction('question','鼠标／触控'));
$('previous').addEventListener('click',()=>dispatch('left','鼠标／触控'));
$('next').addEventListener('click',()=>dispatch('right','鼠标／触控'));
$('new-round').addEventListener('click',()=>$('reset-dialog').showModal());
$('cancel-reset').addEventListener('click',()=>$('reset-dialog').close());
$('confirm-reset').addEventListener('click',()=>{dispatch('reset','鼠标／触控');$('reset-dialog').close();$('main-action').focus();});
$('retry-listening').addEventListener('click',startRecognition);
$('stop-listening').addEventListener('click',()=>{stopRecognition();setQuestionStatus('stopped',$('question-draft').value.trim()?'聆听已停止。可以修改文字，再确认问题。':'聆听已停止。可以重试或直接输入问题。');});
$('cancel-question').addEventListener('click',()=>{stopRecognition(true);setQuestionStatus('stopped','本次提问已取消，未确认的文字不会写入占卜。');$('question-dialog').close();$('question-action').focus();});
$('question-dialog').addEventListener('cancel',event=>{event.preventDefault();stopRecognition(true);setQuestionStatus('stopped','本次提问已取消，未确认的文字不会写入占卜。');$('question-dialog').close();$('question-action').focus();});
$('question-draft').addEventListener('input',()=>{
  $('confirm-question').disabled=!$('question-draft').value.trim();
  if(questionStatus!=='listening')setQuestionStatus($('question-draft').value.trim()?'reviewing':'stopped',$('question-draft').value.trim()?'可以继续修改；确认后才会写入本次占卜。':'尚无问题文字。可以重试语音或直接输入。');
});
$('confirm-question').addEventListener('click',()=>{
  const value=$('question-draft').value.trim();
  if(!value)return;
  stopRecognition(true);
  const next=transition(state,{type:'set-question',value});
  if(next!==state){state=next;saveState();render();}
  $('stage-message').textContent=`问题已确认：${value}`;
  setQuestionStatus('idle','问题已写入本次占卜。再次按 S3 可以修改。');
  $('question-dialog').close();$('question-action').focus();
});
$('show-input').addEventListener('click',()=>{const open=$('input-panel').hidden;$('input-panel').hidden=!open;$('show-input').setAttribute('aria-expanded',String(open));if(open)$('input-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});});
const codes=[...Array.from({length:8},(_,i)=>'Digit'+(i+1)),'ArrowLeft','ArrowRight','Enter'];
for(const code of codes){const key=document.createElement('div');key.className='monitor-key';key.dataset.code=code;key.innerHTML=`${code.startsWith('Digit')?code.slice(-1):code==='ArrowLeft'?'←':code==='ArrowRight'?'→':'Enter'}<small>0 次</small>`;$('key-monitor').append(key);}
function updateLog(){
  $('input-counts').textContent=`收到 ${received} 次 · 接受 ${accepted} 次 · 忽略重复 ${duplicates} 次`;
  const nodes=logs.map(line=>{const li=document.createElement('li');li.textContent=line;return li;});
  if(!nodes.length){const li=document.createElement('li');li.className='log-empty';li.textContent='还没有输入记录';nodes.push(li);}
  $('event-log').replaceChildren(...nodes);
}
document.addEventListener('keydown',event=>{
  const interactive=event.target.closest('input,textarea,select,[contenteditable="true"],summary');
  if($('reset-dialog').open||$('question-dialog').open||(interactive&&interactive.id!=='test-only'))return;
  const input=keyInput(event,held);if(!input)return;
  event.preventDefault();received++;
  let outcome;
  if(input.duplicate){duplicates++;outcome='忽略重复（长按／尚未松开）';}
  else{
    accepted++;
    const canonical=input.code.replace('Numpad','Digit').replace('DigitEnter','Enter');
    hits.set(canonical,(hits.get(canonical)||0)+1);
    const tile=[...$('key-monitor').children].find(el=>el.dataset.code===canonical);
    if(tile){tile.classList.add('hit');tile.querySelector('small').textContent=`${hits.get(canonical)} 次`;clearTimeout(timers.get(canonical));timers.set(canonical,setTimeout(()=>tile.classList.remove('hit'),350));}
    outcome=$('test-only').checked?'仅测试，牌组不变':input.action?(performAction(input.action,'键盘输入')?'执行成功':'状态锁定／条件未满足'):'已收到，未绑定动作';
  }
  logs.unshift(`${new Date().toLocaleTimeString('zh-CN',{hour12:false})}  ${input.code}  → ${outcome}`);logs=logs.slice(0,20);updateLog();
});
document.addEventListener('keyup',event=>held.delete(event.code));
function focusStatus(){held.clear();$('focus-status').textContent=document.hasFocus()&&!document.hidden?'页面可接收输入':'页面未聚焦 · 点击页面后测试';}
window.addEventListener('blur',focusStatus);window.addEventListener('focus',focusStatus);document.addEventListener('visibilitychange',focusStatus);
$('clear-log').addEventListener('click',()=>{received=accepted=duplicates=0;logs=[];hits.clear();for(const tile of $('key-monitor').children)tile.querySelector('small').textContent='0 次';updateLog();});
render();focusStatus();
if(greetingPlayed)$('greeting-status').textContent='启动语已在本标签页播放过。';
if(state.phase==='revealed')$('stage-message').textContent='已恢复本次抽卡结果。继续按键不会改变牌面。';
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  const tools=[
    {name:'read_tarot_state',description:'读取当前单张抽卡状态和已确认结果。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({...state})},
    {name:'control_tarot_draw',description:'开始抽卡、左右选择或确认一张牌。确认后锁定结果，不能通过此工具重置。',inputSchema:{type:'object',properties:{action:{type:'string',enum:['start','left','right','confirm']}},required:['action'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{if(!input||Object.keys(input).length!==1||!['start','left','right','confirm'].includes(input.action))throw new Error('无效动作');const changed=dispatch(input.action,'网页工具');return {changed,...state};}}
  ];
  for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',event=>{if(!event.persisted)lifecycle.abort();});
}
