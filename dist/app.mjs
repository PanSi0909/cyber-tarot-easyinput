import {cards,spreads,fresh,restore,transition,keyInput,fixedTextAction,maxQuestionLength,recognitionFailureMessage} from './core.mjs?v=0.5.1';
const $=id=>document.getElementById(id);
const storageKey='cyber-tarot.v1',greetingKey='cyber-tarot.greeting.v1';
const held=new Set(),hits=new Map(),timers=new Map();
let state=fresh(),greetingPlayed=false,storageAvailable=true,received=0,accepted=0,duplicates=0,logs=[];
let recognition=null,questionStatus='idle',resultFocus=0;
try{state=restore(sessionStorage.getItem(storageKey));}catch{}
try{greetingPlayed=sessionStorage.getItem(greetingKey)==='1';}catch{}

const spreadPositions={
  'one-card':['核心'],
  'time-flow':['过去','现在','未来'],
  choice:['现状','路径 A','路径 A 结果','路径 B','路径 B 结果'],
  'celtic-cross':['现状','挑战','根基','过去','可能','未来','自我','环境','希望与恐惧','结果']
};
function acceptsHardwareCommand(){return ['idle','configuring','revealed'].includes(state.phase);}
function commandFocus(){if(acceptsHardwareCommand()&&document.hasFocus())$('command-input').focus({preventScroll:true});}
function saveState(){try{sessionStorage.setItem(storageKey,JSON.stringify(state));}catch{storageAvailable=false;}}
function currentSpread(){return spreads.find(spread=>spread.id===state.spreadChoice);}
function updateQuestionControls(){
  const enabled=state.phase==='selecting',hasDraft=Boolean($('question-draft').value.trim());
  $('question-draft').disabled=!enabled;$('question-action').disabled=!enabled;
  $('browser-listen').disabled=!enabled||questionStatus==='listening';$('stop-listening').disabled=questionStatus!=='listening';
  $('clear-question').disabled=!enabled||!hasDraft;$('confirm-question').disabled=!enabled||!hasDraft;
}
function setQuestionStatus(status,message){
  questionStatus=status;const labels={idle:'待机',listening:'正在聆听',stopped:'已停止',reviewing:'等待确认',failed:'失败'};
  for(const badge of document.querySelectorAll('.question-state')){badge.dataset.state=status;badge.textContent=labels[status];}
  $('question-status-message').textContent=message;updateQuestionControls();
}
function playGreeting(){
  if(greetingPlayed)return false;greetingPlayed=true;try{sessionStorage.setItem(greetingKey,'1');}catch{}
  const synth=window.speechSynthesis,Utterance=window.SpeechSynthesisUtterance;
  if(!synth||!Utterance){$('greeting-status').textContent='当前浏览器无法播放启动语，不影响继续使用。';return false;}
  try{
    synth.cancel();const utterance=new Utterance('欢迎回来。想好问题，我们开始吧。');utterance.lang='zh-CN';utterance.rate=1.05;utterance.pitch=1;
    utterance.onend=()=>{$('greeting-status').textContent='启动语已播放 · 本标签页只播放一次。';};
    utterance.onerror=()=>{$('greeting-status').textContent='启动语播放失败，不影响继续使用。';};
    synth.speak(utterance);$('greeting-status').textContent='正在播放启动语 · 本标签页只播放一次。';return true;
  }catch{$('greeting-status').textContent='启动语播放失败，不影响继续使用。';return false;}
}
function stopRecognition(abort=false){const active=recognition;recognition=null;if(!active)return;try{abort?active.abort():active.stop();}catch{}}
function startRecognition(){
  if(state.phase!=='selecting'){setQuestionStatus('idle','先完成开始和牌阵选择，再输入问题。');return false;}
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition){setQuestionStatus('failed','当前浏览器不支持语音识别，请直接输入问题。');$('question-draft').focus();return false;}
  stopRecognition(true);const active=new Recognition();recognition=active;active.lang='zh-CN';active.interimResults=true;active.continuous=false;
  active.onstart=()=>{if(recognition===active)setQuestionStatus('listening','正在聆听。说完后可停止，也可以直接修改识别文字。');};
  active.onresult=event=>{
    if(recognition!==active)return;let transcript='';for(let i=0;i<event.results.length;i++)transcript+=event.results[i][0].transcript;
    $('question-draft').value=transcript.slice(0,maxQuestionLength);updateQuestionControls();
    if(event.results[event.results.length-1].isFinal){setQuestionStatus('reviewing','识别文字可以修改；确认后才会写入本次占卜。');try{active.stop();}catch{}}
    else setQuestionStatus('listening','正在聆听。识别文字会实时出现，说完后可以停止。');
  };
  active.onerror=event=>{if(recognition!==active)return;recognition=null;setQuestionStatus('failed',recognitionFailureMessage(event.error));$('question-draft').focus();};
  active.onend=()=>{if(recognition!==active)return;recognition=null;const hasText=$('question-draft').value.trim();if(questionStatus==='listening')setQuestionStatus(hasText?'reviewing':'stopped',hasText?'请检查识别文字，确认后写入本次占卜。':'聆听已停止。可以重试或直接输入问题。');};
  try{active.start();setQuestionStatus('listening','正在请求麦克风并准备聆听。');return true;}catch{recognition=null;setQuestionStatus('failed','无法启动语音识别，请直接输入问题。');$('question-draft').focus();return false;}
}
function focusQuestion(){
  if(state.phase!=='selecting'){$('stage-message').textContent=state.phase==='spread-selecting'?'先旋转并短按旋钮确认牌阵。':state.phase==='configuring'?'先按 S2 进入牌阵选择。':'先按 S1 开始本次占卜。';return false;}
  $('question-draft').focus();setQuestionStatus($('question-draft').value.trim()?'reviewing':'idle',$('question-draft').value.trim()?'检查或修改文字，确认后写入本次占卜。':'问题框已聚焦。现在按 S3 说话，转写会直接进入这里。');return true;
}
function renderSpreadPicker(){
  $('spread-picker').replaceChildren(...spreads.map((spread,index)=>{
    const button=document.createElement('button');button.type='button';button.className='spread-option';button.setAttribute('role','option');
    button.classList.toggle('selected',index===state.spreadIndex);button.setAttribute('aria-selected',String(index===state.spreadIndex));
    const diagram=document.createElement('span');diagram.className=`spread-diagram spread-${spread.count}`;
    for(let i=0;i<spread.count;i++)diagram.append(document.createElement('i'));
    button.append(diagram);button.insertAdjacentHTML('beforeend',`<span class="spread-copy"><small>SPREAD / ${spread.count} · ${spread.en}</small><strong>${spread.name}</strong><span>${spread.description}</span></span>`);
    button.addEventListener('click',()=>dispatch(index,'鼠标／触控'));return button;
  }));
}
function nearbyCards(radius=3){
  const picked=new Set(state.picked),result=[{deckIndex:state.selected,offset:0}];
  for(const direction of [-1,1]){let cursor=state.selected;for(let step=1;step<=radius;step++){do{cursor=(cursor+direction+state.deck.length)%state.deck.length;}while(picked.has(state.deck[cursor]));result.push({deckIndex:cursor,offset:direction*step});}}
  return result.sort((a,b)=>a.offset-b.offset);
}
function renderDeck(){
  if(state.phase!=='selecting'){$('deck').replaceChildren();return;}
  const nodes=nearbyCards().map(({deckIndex,offset})=>{
    const button=document.createElement('button');button.type='button';button.className='tarot-card';button.classList.toggle('selected',offset===0);
    button.style.setProperty('--offset',String(offset));button.style.setProperty('--distance',String(Math.abs(offset)));
    button.innerHTML=`<span class="card-symbol" aria-hidden="true">✦</span><span class="card-index">${String(deckIndex+1).padStart(2,'0')}</span>`;
    button.setAttribute('aria-label',`选择随机牌组中的第 ${deckIndex+1} 个位置`);button.setAttribute('aria-pressed',String(offset===0));button.addEventListener('click',()=>dispatch(deckIndex,'鼠标／触控'));return button;
  });$('deck').replaceChildren(...nodes);
}
function renderResultDetail(){
  const id=state.results[resultFocus],card=cards.find(item=>item.id===id),labels=spreadPositions[state.spreadChoice]||[];if(!card)return;
  $('result-position').textContent=`${String(resultFocus+1).padStart(2,'0')} / ${String(state.results.length).padStart(2,'0')} · ${labels[resultFocus]||'牌阵位置'}`;
  $('result-name').textContent=card.name;$('result-en').textContent=card.en;$('result-keywords').textContent=card.keywords;$('result-text').textContent=card.text;$('result-question').textContent=card.question;
  [...$('result-spread').children].forEach((node,index)=>{node.classList.toggle('active',index===resultFocus);node.setAttribute('aria-pressed',String(index===resultFocus));});
}
function renderResult(){
  if(state.phase!=='revealed')return;const spread=currentSpread();resultFocus=Math.min(resultFocus,state.results.length-1);
  $('result-spread-name').textContent=spread.name;$('result-spread').className=`result-spread spread-layout-${spread.count}`;const labels=spreadPositions[spread.id]||[];
  const nodes=state.results.map((id,index)=>{const card=cards.find(item=>item.id===id),button=document.createElement('button');button.type='button';button.className='result-card';button.dataset.family=card.category;button.innerHTML=`<small>${String(index+1).padStart(2,'0')} · ${labels[index]||''}</small><b>${card.symbol}</b><strong>${card.name}</strong>`;button.setAttribute('aria-label',`查看第 ${index+1} 张：${card.name}`);button.addEventListener('click',()=>{resultFocus=index;renderResultDetail();});return button;});
  $('result-spread').replaceChildren(...nodes);renderResultDetail();
}
function render(){
  const configuring=state.phase==='configuring',spreadSelecting=state.phase==='spread-selecting',selecting=state.phase==='selecting',revealed=state.phase==='revealed';
  $('spread-picker').hidden=!spreadSelecting;$('deck').hidden=!selecting;renderSpreadPicker();renderDeck();
  $('phase-label').textContent=state.phase==='idle'?'01 / 准备':configuring?'02 / 等待牌阵':spreadSelecting?'02 / 牌阵选择':selecting?'03 / 提问与抽牌':'04 / 牌阵揭晓';
  $('stage-title').textContent=state.phase==='idle'?'先留一点空白':configuring?'按 S2 选择牌阵':spreadSelecting?'选择问题需要的结构':selecting?'让牌停在直觉所在的位置':'牌阵已经完成';
  $('stage-hint').textContent=state.phase==='idle'?'按下 S1，开始这次占卜。':configuring?'按 S2 进入牌阵选择。':spreadSelecting?'旋转浏览牌阵，短按旋钮确认。':selecting?'按 S3 输入问题；确认后旋转牌组，短按逐张选牌。':'旋转旋钮或点击牌面，查看每张牌的信息。';
  const spread=currentSpread();
  $('selection-label').textContent=state.phase==='idle'?'等待开始':configuring?'等待 S2':spreadSelecting?`${state.spreadIndex+1} / ${spreads.length} · ${spreads[state.spreadIndex].name}`:selecting?`牌组位置 ${state.selected+1} / 78 · 已选 ${state.picked.length} / ${spread.count}`:`${spread?.name||''} · ${state.results.length} 张`;
  $('previous').disabled=!(spreadSelecting||selecting||revealed);$('next').disabled=!(spreadSelecting||selecting||revealed);
  $('main-label').textContent=state.phase==='idle'?'开始':configuring?'进入牌阵选择':spreadSelecting?'确认此牌阵':selecting?`选中这张 · ${state.picked.length+1}/${spread.count}`:'开始新一次';
  $('main-key').textContent=state.phase==='idle'||revealed?'开始':configuring?'牌阵选择':'Enter';
  $('current-setup').textContent=spread?`当前牌阵：${spread.name} · ${spread.count} 张 · 随机 78 张牌组`:spreadSelecting?`当前指向：${spreads[state.spreadIndex].name} · ${spreads[state.spreadIndex].count} 张`:configuring?'按 S2 进入牌阵选择。':'牌阵尚未选择。';
  $('current-setup').classList.toggle('confirmed',Boolean(spread));$('current-question').textContent=state.question?`本次问题：${state.question}`:'尚未确认问题。语音识别文字只有确认后才会进入本次占卜。';$('current-question').classList.toggle('confirmed',Boolean(state.question));updateQuestionControls();
  $('result-overlay').hidden=!revealed;if(revealed)renderResult();
}
function dispatch(action,source){
  const previous=state,next=transition(state,action);
  if(next===state){$('stage-message').textContent=state.phase==='revealed'?'结果已锁定；旋转只切换牌面说明，S1 开始新一轮。':state.phase==='idle'?'按 S1 开始。':state.phase==='configuring'?'按 S2 进入牌阵选择。':'当前动作不可用。';return false;}
  state=next;saveState();if(action==='start'&&previous.phase==='revealed'){$('question-draft').value='';resultFocus=0;}render();
  if(state.phase==='configuring'){setQuestionStatus('idle','按 S2 进入牌阵选择。');commandFocus();}
  else if(state.phase==='spread-selecting')$('stage-message').textContent=`${source} · 旋转选择牌阵，短按确认。`;
  else if(state.phase==='selecting'&&previous.phase==='spread-selecting'){$('stage-message').textContent=`${source} · ${currentSpread().name}已确认，78 张牌已随机洗牌。`;setQuestionStatus('idle','问题框已聚焦。现在按 S3 说话，转写会直接进入这里。');$('question-draft').focus();}
  else if(state.phase==='selecting'&&state.picked.length>previous.picked.length)$('stage-message').textContent=`${source} · 已选第 ${state.picked.length} 张，还需要 ${currentSpread().count-state.picked.length} 张。`;
  else if(state.phase==='revealed'){$('stage-message').textContent=`${currentSpread().name}已完成。${storageAvailable?'刷新后仍保留。':'浏览器未允许保存，请勿刷新。'}`;setQuestionStatus('idle','本次问题和牌阵已经锁定。');commandFocus();}
  else $('stage-message').textContent=`${source} · 当前停在随机牌组第 ${state.selected+1} 个位置。`;return true;
}
function openSetup(source){if(state.phase==='configuring')return dispatch('setup',source);if(state.phase==='spread-selecting')return true;if(state.phase==='selecting')return focusQuestion();$('stage-message').textContent=state.phase==='idle'?'先按 S1 开始。':'按 S1 开始新一轮后再选择牌阵。';return false;}
function showResultStep(action){if(state.phase!=='revealed'||!['left','right'].includes(action))return false;resultFocus=(resultFocus+(action==='left'?-1:1)+state.results.length)%state.results.length;renderResultDetail();return true;}
function performAction(action,source){if(action==='start')playGreeting();if(action==='setup')return openSetup(source);if(action==='question')return focusQuestion();if(showResultStep(action))return true;if(action==='confirm'&&document.activeElement===$('question-draft'))return confirmQuestion(source);return dispatch(action,source);}
function mainAction(){if(state.phase==='idle'||state.phase==='revealed')return 'start';if(state.phase==='configuring')return 'setup';return 'confirm';}
$('main-action').addEventListener('click',()=>performAction(mainAction(),'鼠标／触控'));
$('question-action').addEventListener('click',()=>performAction('question','鼠标／触控'));
$('previous').addEventListener('click',()=>performAction('left','鼠标／触控'));
$('next').addEventListener('click',()=>performAction('right','鼠标／触控'));
$('new-round').addEventListener('click',()=>performAction('start','鼠标／触控'));
function receiveFixedText(value){
  const command=fixedTextAction(value);if(!command)return false;$('command-input').value='';received++;accepted++;
  const label=command==='start'?'开始':'牌阵选择',outcome=$('test-only').checked?'仅测试，不改变流程':performAction(command,'EasyInput S'+(command==='start'?'1':'2'))?'执行成功':'状态锁定／条件未满足';
  logs.unshift(`${new Date().toLocaleTimeString('zh-CN',{hour12:false})}  S${command==='start'?'1':'2'}“${label}”  → ${outcome}`);logs=logs.slice(0,20);updateLog();return true;
}
$('command-input').addEventListener('input',()=>receiveFixedText($('command-input').value));
document.addEventListener('paste',event=>{
  if(!acceptsHardwareCommand()||event.target===$('question-draft'))return;
  const text=event.clipboardData?.getData('text/plain')||'';if(receiveFixedText(text))event.preventDefault();
});
$('browser-listen').addEventListener('click',startRecognition);
$('stop-listening').addEventListener('click',()=>{stopRecognition();setQuestionStatus('stopped',$('question-draft').value.trim()?'聆听已停止。可以修改文字，再确认问题。':'聆听已停止。可以重试或直接输入问题。');});
$('clear-question').addEventListener('click',()=>{stopRecognition(true);$('question-draft').value='';setQuestionStatus('stopped','问题文字已清空，当前占卜中的已确认问题不会改变。');$('question-draft').focus();});
$('question-draft').addEventListener('input',()=>{if(questionStatus!=='listening')setQuestionStatus($('question-draft').value.trim()?'reviewing':'stopped',$('question-draft').value.trim()?'可以继续修改；短按旋钮或点击确认后才会写入本次占卜。':'尚无问题文字。可以按 S3 语音输入，或直接打字。');});
function confirmQuestion(source){
  const value=$('question-draft').value.trim();if(!value){setQuestionStatus('stopped','还没有问题文字。请先按 S3 说话，或直接输入。');return false;}
  stopRecognition(true);const next=transition(state,{type:'set-question',value});if(next!==state){state=next;saveState();render();}
  $('stage-message').textContent=`${source} · 问题已确认。现在旋转并短按选择第 1 张牌。`;setQuestionStatus('idle','问题已写入本次占卜。现在旋转选择牌背，再短按旋钮选牌。');$('next').focus();return true;
}
$('confirm-question').addEventListener('click',()=>confirmQuestion('鼠标／触控'));
$('show-input').addEventListener('click',()=>{const open=$('input-panel').hidden;$('input-panel').hidden=!open;$('show-input').setAttribute('aria-expanded',String(open));if(open)$('input-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});});
const codes=[...Array.from({length:8},(_,i)=>'Digit'+(i+1)),'ArrowLeft','ArrowRight','Enter'];
for(const code of codes){const key=document.createElement('div');key.className='monitor-key';key.dataset.code=code;key.innerHTML=`${code.startsWith('Digit')?code.slice(-1):code==='ArrowLeft'?'←':code==='ArrowRight'?'→':'Enter'}<small>0 次</small>`;$('key-monitor').append(key);}
function updateLog(){
  $('input-counts').textContent=`收到 ${received} 次 · 接受 ${accepted} 次 · 忽略重复 ${duplicates} 次`;const nodes=logs.map(line=>{const li=document.createElement('li');li.textContent=line;return li;});
  if(!nodes.length){const li=document.createElement('li');li.className='log-empty';li.textContent='还没有输入记录';nodes.push(li);}$('event-log').replaceChildren(...nodes);
}
document.addEventListener('keydown',event=>{
  if(acceptsHardwareCommand()&&document.activeElement!==$('command-input')&&!event.ctrlKey&&!event.metaKey&&!event.altKey)$('command-input').focus({preventScroll:true});
},true);
document.addEventListener('keydown',event=>{
  const interactive=event.target.closest('input,textarea,select,[contenteditable="true"],summary'),questionConfirm=interactive?.id==='question-draft'&&['Enter','NumpadEnter'].includes(event.code),questionShortcut=interactive?.id==='question-draft'&&['Digit3','Numpad3'].includes(event.code),commandKey=interactive?.id==='command-input';
  if(interactive&&interactive.id!=='test-only'&&!questionConfirm&&!questionShortcut&&!commandKey)return;const input=keyInput(event,held);if(!input)return;event.preventDefault();received++;let outcome;
  if(input.duplicate){duplicates++;outcome='忽略重复（长按／尚未松开）';}
  else{
    accepted++;const canonical=input.code.replace('Numpad','Digit').replace('DigitEnter','Enter');hits.set(canonical,(hits.get(canonical)||0)+1);const tile=[...$('key-monitor').children].find(el=>el.dataset.code===canonical);
    if(tile){tile.classList.add('hit');tile.querySelector('small').textContent=`${hits.get(canonical)} 次`;clearTimeout(timers.get(canonical));timers.set(canonical,setTimeout(()=>tile.classList.remove('hit'),350));}
    outcome=$('test-only').checked?'仅测试，不改变流程':input.action?(performAction(input.action,'键盘／旋钮')?'执行成功':'状态锁定／条件未满足'):'已收到，未绑定动作';
  }
  logs.unshift(`${new Date().toLocaleTimeString('zh-CN',{hour12:false})}  ${input.code}  → ${outcome}`);logs=logs.slice(0,20);updateLog();
});
document.addEventListener('keyup',event=>held.delete(event.code));
function focusStatus(){held.clear();$('focus-status').textContent=document.hasFocus()&&!document.hidden?'页面可接收输入':'页面未聚焦 · 点击页面后测试';}
window.addEventListener('blur',focusStatus);
window.addEventListener('focus',()=>{focusStatus();requestAnimationFrame(commandFocus);});
document.addEventListener('visibilitychange',()=>{focusStatus();if(!document.hidden)requestAnimationFrame(commandFocus);});
document.addEventListener('pointerup',()=>{if(acceptsHardwareCommand())requestAnimationFrame(commandFocus);});
$('clear-log').addEventListener('click',()=>{received=accepted=duplicates=0;logs=[];hits.clear();for(const tile of $('key-monitor').children)tile.querySelector('small').textContent='0 次';updateLog();});
$('question-draft').value=state.question||'';render();focusStatus();
if(state.phase==='configuring'){setQuestionStatus('idle','按 S2 进入牌阵选择。');commandFocus();}
if(state.phase==='spread-selecting')setQuestionStatus('idle','旋转选择牌阵，短按旋钮确认。');
if(state.phase==='selecting'){setQuestionStatus(state.question?'idle':'stopped',state.question?'问题已写入本次占卜；旋转选择牌背，再短按旋钮选牌。':'问题框可用。按 S3 说话，或直接输入。');(state.question?$('next'):$('question-draft')).focus();}
if(state.phase==='revealed'){setQuestionStatus('idle','本次问题和牌阵已经锁定。');$('stage-message').textContent='已恢复本次牌阵结果。旋转可查看每张牌的信息。';commandFocus();}
if(state.phase==='idle')commandFocus();if(greetingPlayed)$('greeting-status').textContent='启动语已在本标签页播放过。';
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController(),tools=[
    {name:'read_tarot_state',description:'读取当前牌阵、随机牌组进度和已确认结果。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({...state})},
    {name:'control_tarot_draw',description:'开始、进入牌阵选择、旋转或确认当前项目。',inputSchema:{type:'object',properties:{action:{type:'string',enum:['start','setup','left','right','confirm']}},required:['action'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{if(!input||Object.keys(input).length!==1||!['start','setup','left','right','confirm'].includes(input.action))throw new Error('无效动作');return {changed:performAction(input.action,'网页工具'),...state};}}
  ];for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}window.addEventListener('pagehide',event=>{if(!event.persisted)lifecycle.abort();});
}
