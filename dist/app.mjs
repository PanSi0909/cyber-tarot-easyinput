import {cards,spreads,spreadPositions,cardOrientation,fresh,restore,transition,keyInput,fixedTextAction,canReceiveHardwareText,maxQuestionLength,recognitionFailureMessage} from './core.mjs?v=1.5.0';
import {interpretCard,getCardKnowledge} from './tarot-knowledge.mjs?v=0.8.0';
import {buildReadingInput,readingFingerprint,requestInitialReading,requestFollowUp,createReadingSession,appendFollowUp,restoreReadingSession,mockReadingProvider,apiReadingProvider} from './ai-reading.mjs?v=0.8.0';
import {historyRecordSchemaVersion,createHistoryRecord,upsertHistoryRecord,serializeHistoryBackup,restoreHistoryBackup,openHistoryDatabase,listHistoryRecords,saveHistoryRecord,replaceHistoryRecords} from './history.mjs?v=0.9.0';
import {renderCardBack,renderCardFace} from './card-visuals.mjs?v=1.4.0';
import {freshLearning,restoreLearning,serializeLearning,learningTransition,compareLearningInterpretation} from './learning.mjs?v=1.0.0';
import {insightRanges,freshInsightState,insightTransition,analyzeHistory,buildInsightSummary,requestInsight,mockInsightProvider,apiInsightProvider,createInsightReport,openInsightDatabase,saveInsightReport} from './insights.mjs?v=1.5.0';
const $=id=>document.getElementById(id);
const storageKey='cyber-tarot.v1',greetingKey='cyber-tarot.greeting.v1',readingStorageKey='cyber-tarot.reading.v1',learningStorageKey='cyber-tarot.learning.v1';
const held=new Set(),hits=new Map(),timers=new Map();
const readingProvider=new URLSearchParams(location.search).get('provider')==='api'?apiReadingProvider:mockReadingProvider;
const insightProvider=readingProvider===apiReadingProvider?apiInsightProvider:mockInsightProvider;
let state=fresh(),greetingPlayed=false,storageAvailable=true,received=0,accepted=0,duplicates=0,logs=[];
let recognition=null,questionStatus='idle',resultFocus=0;
let readingSession=null,readingStatus='idle',readingError='',readingMode=false;
let historyDatabase=null,historyRecords=[],historyStatus='loading',historyMessage='正在读取本机历史记录…',historyLoaded=false,historyPendingRecord=null,historyPendingRecords=null,historyPendingImportCount=0,historyRetryAction='load',selectedHistoryId=null,historySaveQueue=Promise.resolve();
let historyToolOpen=false,historyToolIndex=0,readingScrollBeforeHistory=0;
let learning=freshLearning(),learningActionIndex=1;
let insights=freshInsightState(),insightDatabase=null,insightGenerationToken=0;
let deckMotionTimer=null;
try{state=restore(sessionStorage.getItem(storageKey));}catch{}
try{greetingPlayed=sessionStorage.getItem(greetingKey)==='1';}catch{}
try{learning=restoreLearning(sessionStorage.getItem(learningStorageKey),cards.length);}catch{}

function acceptsHardwareCommand(){return insights.active||learning.active||historyToolOpen||canReceiveHardwareText(state);}
function userIsEditing(){const active=document.activeElement;return active&&![$('command-input'),$('learning-command-input'),$('insights-command-input')].includes(active)&&active.matches('input,textarea,select,[contenteditable="true"]');}
function commandFocus(){if(!document.hasFocus())return;if(insights.active){$('insights-command-input').focus({preventScroll:true});return;}if(learning.active){const target=learning.detailOpen&&!learning.confirmed?$('learning-draft'):$('learning-command-input');if(document.activeElement!==target)target.focus({preventScroll:true});return;}if(historyToolOpen){$('command-input').focus({preventScroll:true});return;}if(state.phase==='selecting'&&!state.question){$('question-draft').focus({preventScroll:true});return;}if(userIsEditing())return;if(state.phase==='revealed'&&readingSession){$('follow-up').focus({preventScroll:true});return;}if(acceptsHardwareCommand())$('command-input').focus({preventScroll:true});}
function saveState(){try{sessionStorage.setItem(storageKey,JSON.stringify(state));}catch{storageAvailable=false;}}
function saveLearning(){try{sessionStorage.setItem(learningStorageKey,serializeLearning(learning));}catch{storageAvailable=false;}}
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
    for(let i=0;i<spread.count;i++){
      const marker=document.createElement('i');
      diagram.append(marker);
    }
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
    button.style.setProperty('--offset',String(offset));button.style.setProperty('--distance',String(Math.abs(offset)));button.style.setProperty('--wave-right-order',String(offset+3));button.style.setProperty('--wave-left-order',String(3-offset));
    button.innerHTML=renderCardBack();
    const relativeLabel=offset===0?'当前牌背':offset<0?`左侧第 ${Math.abs(offset)} 张牌背`:`右侧第 ${offset} 张牌背`;
    button.setAttribute('aria-label',`选择${relativeLabel}`);button.setAttribute('aria-pressed',String(offset===0));button.addEventListener('click',()=>dispatch(deckIndex,'鼠标／触控'));return button;
  });$('deck').replaceChildren(...nodes);
}
function showDeckMotion(direction){
  const deck=$('deck'),motionClass=direction==='right'?'deck-turn-right':'deck-turn-left';
  clearTimeout(deckMotionTimer);deck.classList.remove('deck-turn-left','deck-turn-right');void deck.offsetWidth;deck.classList.add(motionClass);
  deckMotionTimer=setTimeout(()=>deck.classList.remove('deck-turn-left','deck-turn-right'),820);
}
function scrollToDeck(){
  const behavior=matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
  requestAnimationFrame(()=>requestAnimationFrame(()=>$('deck').scrollIntoView({behavior,block:'center'})));
}
function renderResultDetail(){
  const id=state.results[resultFocus],card=cards.find(item=>item.id===id),labels=spreadPositions[state.spreadChoice]||[],orientation=cardOrientation(state,id);if(!card)return;
  const interpretation=interpretCard(card,orientation,labels[resultFocus]||'牌阵位置',state.spreadChoice);
  $('result-position').textContent=`${String(resultFocus+1).padStart(2,'0')} / ${String(state.results.length).padStart(2,'0')} · ${labels[resultFocus]||'牌阵位置'} · ${orientation==='reversed'?'逆位':'正位'}`;
  $('result-name').textContent=card.name;$('result-en').textContent=card.en;$('result-keywords').textContent=`${card.keywords} · ${interpretation.archetype}`;$('result-text').textContent=interpretation.text;$('result-question').textContent=interpretation.reflection;
  [...$('result-spread').children].forEach((node,index)=>{node.classList.toggle('active',index===resultFocus);node.setAttribute('aria-pressed',String(index===resultFocus));});
}
function renderResult(){
  if(state.phase!=='revealed')return;const spread=currentSpread();resultFocus=Math.min(resultFocus,state.results.length-1);
  $('result-spread-name').textContent=spread.name;$('result-spread').className=`result-spread spread-layout-${spread.count}`;const labels=spreadPositions[spread.id]||[];
  const nodes=state.results.map((id,index)=>{const card=cards.find(item=>item.id===id),orientation=cardOrientation(state,id),button=document.createElement('button');button.type='button';button.className='result-card';button.classList.toggle('reversed',orientation==='reversed');button.dataset.family=card.category;button.style.setProperty('--reveal-index',String(index));button.innerHTML=`<small class="result-card-position">${String(index+1).padStart(2,'0')} · ${labels[index]||''}</small>${renderCardFace(card,orientation)}`;button.setAttribute('aria-label',`查看第 ${index+1} 张：${card.name}${orientation==='reversed'?'逆位':'正位'}`);button.addEventListener('click',()=>{resultFocus=index;renderResultDetail();});return button;});
  $('result-spread').replaceChildren(...nodes);renderResultDetail();
}
function currentReadingInput(){return buildReadingInput(state);}
function formatHistoryDate(value){try{return new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));}catch{return value;}}
function historyNode(tag,value,className){const node=document.createElement(tag);if(className)node.className=className;node.textContent=value;return node;}
function setHistoryState(status,message,retryAction=historyRetryAction){historyStatus=status;historyMessage=message;historyRetryAction=retryAction;renderHistory();if(insights.active)renderInsights();}
function renderHistoryTool(){
  $('history-tool').hidden=!historyToolOpen;$('history-tool-toggle').setAttribute('aria-expanded',String(historyToolOpen));$('result-overlay').hidden=state.phase!=='revealed'||historyToolOpen;
  [$('history-export'),$('history-restore')].forEach((option,index)=>{const selected=index===historyToolIndex;option.setAttribute('aria-selected',String(selected));option.tabIndex=selected?0:-1;});
}
function setHistoryToolOpen(open,source){
  if(open&&state.phase==='revealed')readingScrollBeforeHistory=document.querySelector('.result-panel').scrollTop;
  historyToolOpen=open;renderHistoryTool();
  if(open){$('stage-message').textContent=`${source} · 旋转选择“保存历史备份”或“从备份恢复”，短按旋钮确认。`;requestAnimationFrame(()=>{$('history-tool').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});$('command-input').focus({preventScroll:true});});}
  else{$('stage-message').textContent=`${source} · 历史备份工具已关闭，已返回综合解读。`;requestAnimationFrame(()=>{commandFocus();if(state.phase==='revealed')requestAnimationFrame(()=>{document.querySelector('.result-panel').scrollTop=readingScrollBeforeHistory;});});}
  return true;
}
function toggleHistoryTool(source){return setHistoryToolOpen(!historyToolOpen,source);}
function moveHistoryTool(action,source){historyToolIndex=1-historyToolIndex;renderHistoryTool();$('stage-message').textContent=`${source} · 已选择${historyToolIndex===0?'“保存历史备份”':'“从备份恢复”'}，短按旋钮确认。`;return true;}
function confirmHistoryTool(source){
  if(historyToolIndex===0){if($('history-export').disabled){setHistoryState('saved','还没有可保存的占卜历史。首次综合解读成功后会自动产生记录。');return false;}return exportHistory();}
  if($('history-restore').disabled){setHistoryState('error','历史存储尚未就绪，请稍后重试。','load');return false;}
  $('stage-message').textContent=`${source} · 请选择以前保存的历史备份文件。`;$('history-import').click();return true;
}
function renderHistoryDetail(record){
  const detail=$('history-detail');detail.hidden=!record;if(!record)return;
  const reading=record.ai.firstReading;$('history-detail-time').textContent=`${formatHistoryDate(record.createdAt)} · 更新 ${formatHistoryDate(record.updatedAt)}`;$('history-detail-title').textContent=record.question;
  $('history-detail-deck').textContent=`${record.deck.name} · ${record.deck.totalCards} 张`;$('history-detail-spread').textContent=`${record.spread.name} · ${record.spread.count} 张`;$('history-detail-version').textContent=record.schemaVersion;
  $('history-detail-question').textContent=record.question;$('history-detail-cards').replaceChildren(...record.cards.map(card=>historyNode('li',`${String(card.order).padStart(2,'0')} · ${card.position} · ${card.name} · ${card.orientation==='reversed'?'逆位':'正位'}`)));
  $('history-detail-reading-title').textContent=reading.title||'综合解读';$('history-detail-overview').textContent=reading.overview||'';$('history-detail-card-readings').replaceChildren(...reading.cardReadings.map((item,index)=>{const card=record.cards[index],node=document.createElement('li');node.append(historyNode('strong',`${card.position} · ${card.name}${card.orientation==='reversed'?'逆位':'正位'}`),historyNode('p',item.visualReading),historyNode('p',item.baseMeaning),historyNode('p',item.contextualReading));return node;}));$('history-detail-flow').textContent=`${reading.flow.movement} ${reading.flow.tension} ${reading.flow.direction}`;$('history-detail-synthesis').textContent=reading.synthesis||'';$('history-detail-guidance').replaceChildren(...(reading.guidance||[]).map(item=>historyNode('li',item)));$('history-detail-voice').textContent=reading.voiceSummary||'';
  const followUps=record.ai.followUps||[];$('history-detail-follow-up-section').hidden=!followUps.length;$('history-detail-follow-ups').replaceChildren(...followUps.map((turn,index)=>{const item=document.createElement('li'),question=historyNode('strong',`追问 ${index+1} · ${turn.question}`),answer=historyNode('p',turn.answer);item.append(question,answer);return item;}));
}
function renderHistory(){
  const labels={loading:'正在加载',saving:'正在保存',saved:'已保存',error:'失败'},busy=historyStatus==='loading'||historyStatus==='saving';$('history-status').dataset.state=historyStatus;$('history-status').textContent=labels[historyStatus]||historyStatus;$('history-message').textContent=historyMessage;$('history-retry').hidden=historyStatus!=='error';$('history-export').disabled=!historyLoaded||!historyRecords.length||busy;$('history-restore').disabled=!historyLoaded||busy;renderHistoryTool();
  let nodes;if(!historyRecords.length){nodes=[historyNode('li',historyStatus==='loading'?'正在加载历史记录…':'还没有已完成的占卜记录。生成首次综合解读后会自动保存。','history-empty')];}else nodes=historyRecords.map(record=>{const item=document.createElement('li'),button=document.createElement('button');button.type='button';button.setAttribute('aria-current',String(record.id===selectedHistoryId));button.append(historyNode('small',formatHistoryDate(record.createdAt)),historyNode('strong',record.question),historyNode('span',`${record.spread.name} · ${record.cards.map(card=>`${card.name}${card.orientation==='reversed'?'逆':''}`).join(' / ')} · ${record.ai.followUps.length} 次追问`));button.addEventListener('click',()=>{selectedHistoryId=record.id;renderHistory();$('history-detail').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});});item.append(button);return item;});$('history-list').replaceChildren(...nodes);
  const selected=historyRecords.find(record=>record.id===selectedHistoryId);renderHistoryDetail(selected);
}
async function loadHistory(){
  historyLoaded=false;setHistoryState('loading','正在读取本机历史记录…','load');
  try{historyDatabase=historyDatabase||await openHistoryDatabase();historyRecords=await listHistoryRecords(historyDatabase);historyLoaded=true;historyPendingRecord=null;historyPendingRecords=null;historyPendingImportCount=0;if(selectedHistoryId&&!historyRecords.some(record=>record.id===selectedHistoryId))selectedHistoryId=null;setHistoryState('saved',historyRecords.length?`已加载 ${historyRecords.length} 条完整会话。`:'历史记录已就绪；首次综合解读成功后会自动保存。');if(readingSession)archiveCurrentSession();return true;}
  catch(error){setHistoryState('error',`历史记录加载失败：${error?.message||'浏览器存储不可用'}`,'load');return false;}
}
function sameHistoryPayload(existing,next){if(!existing)return false;return JSON.stringify(existing)===JSON.stringify({...next,updatedAt:existing.updatedAt});}
function persistHistoryRecord(record){
  historyPendingRecord=record;historySaveQueue=historySaveQueue.catch(()=>{}).then(async()=>{setHistoryState('saving','正在自动保存完整占卜会话…','save-record');await saveHistoryRecord(historyDatabase,record);historyRecords=upsertHistoryRecord(historyRecords,record);if(historyPendingRecord===record)historyPendingRecord=null;setHistoryState('saved',`完整会话已自动保存 · 当前共 ${historyRecords.length} 条。`);return true;}).catch(error=>{setHistoryState('error',`自动保存失败：${error?.message||'请稍后重试'} 当前牌局仍保持不变。`,'save-record');return false;});return historySaveQueue;
}
function archiveCurrentSession(){
  if(!historyLoaded||!historyDatabase||state.phase!=='revealed'||!readingSession)return Promise.resolve(false);
  let record;try{record=createHistoryRecord(state,currentReadingInput(),readingSession);}catch(error){setHistoryState('error',`历史记录整理失败：${error?.message||'会话不完整'}`,'load');return Promise.resolve(false);}
  const existing=historyRecords.find(item=>item.id===record.id);if(sameHistoryPayload(existing,record))return Promise.resolve(true);return persistHistoryRecord(record);
}
function exportHistory(){
  if(!historyLoaded||!historyRecords.length)return false;
  try{const content=serializeHistoryBackup(historyRecords),blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a'),day=new Date().toISOString().slice(0,10);link.href=url;link.download=`cyber-tarot-history-${day}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),0);setHistoryState('saved',`历史备份已保存到下载文件夹，共 ${historyRecords.length} 条记录。请妥善保管这个文件。`);return true;}catch(error){setHistoryState('error',`保存备份失败：${error?.message||'无法生成备份文件'} 当前历史记录没有受到影响。`,'load');return false;}
}
async function persistRestoredHistory(records,imported){
  historyPendingRecords=records;historyPendingImportCount=imported;setHistoryState('saving','正在保存恢复后的历史记录…','save-all');
  try{await replaceHistoryRecords(historyDatabase,records);historyRecords=records;historyPendingRecords=null;historyPendingImportCount=0;setHistoryState('saved',`已从备份找回 ${imported} 条记录，合并后共有 ${historyRecords.length} 条。`);return true;}catch(error){setHistoryState('error',`恢复内容保存失败：${error?.message||'请稍后重试'} 当前历史记录没有受到影响。`,'save-all');return false;}
}
async function importHistory(event){
  const file=event.target.files?.[0];event.target.value='';if(!file){requestAnimationFrame(commandFocus);return;}if(!historyLoaded||!historyDatabase){setHistoryState('error','历史存储尚未就绪，请先重试加载。','load');requestAnimationFrame(commandFocus);return;}
  setHistoryState('loading','正在读取并检查历史备份…','import');
  try{const restored=restoreHistoryBackup(historyRecords,await file.text());await persistRestoredHistory(restored.records,restored.imported);}catch(error){setHistoryState('error',`这个文件不是有效的赛博塔罗历史备份：${error?.message||'无法读取文件'} 当前历史记录没有受到影响。`,'import');}finally{requestAnimationFrame(commandFocus);}
}
function retryHistory(){if(historyRetryAction==='save-record'&&historyPendingRecord)return void persistHistoryRecord(historyPendingRecord);if(historyRetryAction==='save-all'&&historyPendingRecords)return void persistRestoredHistory(historyPendingRecords,historyPendingImportCount);if(historyRetryAction==='import')return $('history-import').click();void loadHistory();}
function saveReadingSession(){try{sessionStorage.setItem(readingStorageKey,JSON.stringify(readingSession));}catch{storageAvailable=false;}}
function clearReadingSession(){readingSession=null;readingStatus='idle';readingError='';try{sessionStorage.removeItem(readingStorageKey);}catch{storageAvailable=false;}}
function loadReadingSession(){
  if(state.phase!=='revealed')return;try{readingSession=restoreReadingSession(sessionStorage.getItem(readingStorageKey),currentReadingInput());readingMode=Boolean(readingSession);}catch{readingSession=null;readingMode=false;}
}
function scrollReadingIntoView(target=$('ai-reading-heading')){
  const behavior=matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
  requestAnimationFrame(()=>requestAnimationFrame(()=>target.scrollIntoView({behavior,block:'start'})));
}
function scrollReadingContent(action){
  if(!readingMode||state.phase!=='revealed'||!['left','right'].includes(action))return false;
  const panel=document.querySelector('.result-panel'),behavior=matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
  panel.scrollBy({top:action==='right'?Math.max(240,panel.clientHeight*.55):-Math.max(240,panel.clientHeight*.55),behavior});return true;
}
function primeFollowUpTarget(){if(readingMode&&readingSession)$('follow-up').focus({preventScroll:true});}
function enterReading(source){
  if(state.phase!=='revealed'){$('stage-message').textContent='完成牌阵后才能进入综合解读。';return false;}
  readingMode=true;scrollReadingIntoView();
  if(readingSession)primeFollowUpTarget();else if(readingStatus!=='loading')void generateReading().then(()=>{scrollReadingIntoView();primeFollowUpTarget();});
  return true;
}
function focusFollowUp(source){
  if(state.phase!=='revealed'||!readingSession){if(state.phase==='revealed'){$('ai-reading-status').textContent=`${source} · 请先按 S4 生成综合解读，再使用 S3 追问。`;scrollReadingIntoView();}return false;}
  readingMode=true;$('follow-up').focus({preventScroll:true});scrollReadingIntoView($('follow-up'));
  $('ai-reading-status').textContent=`${source} · 追问框已聚焦。说完后短按旋钮发送。`;return true;
}
function renderReading(){
  if(state.phase!=='revealed')return;
  const ready=Boolean(readingSession),busy=readingStatus==='loading'||readingStatus==='following';
  $('generate-reading').disabled=busy||ready;$('generate-reading').textContent=readingStatus==='error'?'重试解读':ready?'首次解读已保存':readingStatus==='loading'?'正在生成…':'生成综合解读';
  $('ai-reading-status').textContent=readingStatus==='loading'?`${readingProvider.label}正在读取已锁定的会话…`:readingStatus==='error'?readingError:ready?`首次结果已保存于当前标签页 · ${readingSession.followUps.length} 次追问 · 旋钮上下浏览，S3 发起追问`:'已锁定问题、牌阵、位置和正逆位。按 S4 或点击按钮生成，不会重新抽牌。';
  $('ai-output').hidden=!ready;$('follow-up').disabled=!ready||busy;$('send-follow-up').disabled=!ready||busy;
  if(!ready)return;const reading=readingSession.firstReading;
  $('ai-title').textContent=reading.title;$('ai-overview').textContent=reading.overview;$('ai-flow').textContent=reading.flow.movement;$('ai-tension').textContent=reading.flow.tension;$('ai-direction').textContent=reading.flow.direction;$('ai-synthesis').textContent=reading.synthesis;$('voice-summary').textContent=reading.voiceSummary;
  $('ai-card-readings').replaceChildren(...reading.cardReadings.map(item=>{const li=document.createElement('li'),heading=document.createElement('strong');heading.textContent=`${item.position} · ${item.card} · ${item.orientation==='reversed'?'逆位':'正位'}`;for(const [label,text] of [['牌面线索',item.visualReading],['基础牌义',item.baseMeaning],['结合问题',item.contextualReading]]){const section=document.createElement('div'),title=document.createElement('span'),body=document.createElement('p');section.className='ai-card-section';title.textContent=label;body.textContent=text;section.append(title,body);li.append(section);}li.prepend(heading);return li;}));
  $('ai-guidance').replaceChildren(...reading.guidance.map(item=>{const li=document.createElement('li');li.textContent=item;return li;}));
  $('follow-up-history').replaceChildren(...readingSession.followUps.map((turn,index)=>{const li=document.createElement('li'),question=document.createElement('strong'),answer=document.createElement('p');question.textContent=`追问 ${index+1} · ${turn.question}`;answer.textContent=turn.answer;li.append(question,answer);return li;}));
}
async function generateReading(){
  if(state.phase!=='revealed'||readingStatus==='loading'||readingSession)return false;
  const input=currentReadingInput(),fingerprint=readingFingerprint(input);readingStatus='loading';readingError='';renderReading();
  try{
    const reading=await requestInitialReading(readingProvider,input);if(state.phase!=='revealed'||readingFingerprint(currentReadingInput())!==fingerprint)return false;
    readingSession=createReadingSession(input,reading,readingProvider.id);readingStatus='ready';saveReadingSession();renderReading();void archiveCurrentSession();return true;
  }catch(error){readingStatus='error';readingError=`解读失败：${error?.message||'接口暂时不可用'}。可以重试，牌阵不会改变。`;renderReading();return false;}
}
async function sendFollowUp(){
  const question=$('follow-up').value.trim();if(!readingSession||readingStatus==='following'||!question)return false;
  const input=currentReadingInput(),fingerprint=readingFingerprint(input),session=readingSession;readingStatus='following';readingError='';renderReading();
  try{
    const turn=await requestFollowUp(readingProvider,input,session,question);if(state.phase!=='revealed'||readingFingerprint(currentReadingInput())!==fingerprint||readingSession!==session)return false;
    readingSession=appendFollowUp(session,turn);readingStatus='ready';$('follow-up').value='';$('follow-up').blur();saveReadingSession();renderReading();void archiveCurrentSession();commandFocus();scrollReadingIntoView($('follow-up-history'));return true;
  }catch(error){readingStatus='ready';renderReading();$('ai-reading-status').textContent=`追问失败：${error?.message||'接口暂时不可用'}。可保留问题后重试。`;return false;}
}
function insightList(id,items,empty='暂无'){const values=items.length?items:[empty];$(id).replaceChildren(...values.map(value=>{const item=document.createElement('li');item.textContent=value;return item;}));}
function formatInsightDate(value){try{return new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));}catch{return value;}}
function syncModalInert(){const blocked=learning.active||insights.active;document.querySelector('main').inert=blocked;document.querySelector('body>footer').inert=blocked;$('learning-overlay').inert=insights.active;}
function renderInsights(){
  $('insights-overlay').hidden=!insights.active;$('insights-toggle').setAttribute('aria-pressed',String(insights.active));document.body.classList.toggle('insights-active',insights.active);syncModalInert();
  [...$('insights-range-options').children].forEach((button,index)=>button.setAttribute('aria-selected',String(index===insights.rangeIndex)));
  const range=insightRanges[insights.rangeIndex],labels={idle:'等待选择',loading:'正在生成',ready:'已生成',insufficient:'数据不足',error:'失败'};
  $('insights-status').dataset.state=insights.status;$('insights-status').textContent=labels[insights.status]||insights.status;
  $('insights-message').textContent=insights.status==='idle'?`${range.label} · 选择后短按旋钮或点击生成。`:insights.status==='loading'?`正在根据 ${range.label} 的客观统计生成反思洞察…`:insights.status==='insufficient'?`当前只有 ${insights.analysis?.recordCount||0} 条记录；至少还需要 ${insights.analysis?.needed||0} 条完整记录。`:insights.status==='error'?insights.error:`${range.label}的周期洞察已生成。`;
  const ready=insights.status==='ready';$('insights-knob-context').textContent=ready?'旋钮左右 · 浏览洞察；短按 · 重新选择范围':'旋钮左右 · 选择时间范围；短按 · 生成洞察';
  $('insights-generate').disabled=insights.status==='loading'||!historyLoaded;$('insights-generate').textContent=insights.status==='loading'?'正在生成…':ready?'重新选择时间范围（鼠标／触控）':'使用当前范围生成（鼠标／触控）';$('insights-retry').hidden=insights.status!=='error';
  const analysis=insights.analysis;$('insights-statistics').hidden=!analysis;
  if(analysis){
    $('insights-record-count').textContent=`${analysis.recordCount} 条记录`;$('insights-start').textContent=formatInsightDate(analysis.range.start);$('insights-end').textContent=formatInsightDate(analysis.range.end);$('insights-sample-count').textContent=analysis.sufficient?`${analysis.recordCount} 条 · 达到最小样本`:`${analysis.recordCount} 条 · 还差 ${analysis.needed} 条`;
    insightList('insights-spreads',analysis.spreads.slice(0,5).map(item=>`${item.label} · ${item.count} 次`),'范围内暂无牌阵');insightList('insights-cards',analysis.repeatedCards.slice(0,5).map(item=>`${item.label} · ${item.count} 次`),'没有重复达到 2 次的卡牌');
    $('insights-orientations').textContent=`正位 ${analysis.orientations.upright} 张（${analysis.orientations.uprightPercent}%）· 逆位 ${analysis.orientations.reversed} 张（${analysis.orientations.reversedPercent}%）`;
    const periods=analysis.questionTimes.dayParts.map(item=>`${item.label} ${item.count} 次`).join(' · '),weekdays=analysis.questionTimes.weekdays.slice(0,3).map(item=>`${item.label} ${item.count} 次`).join(' · ');$('insights-times').textContent=periods?`${periods}${weekdays?`；较常见日期：${weekdays}`:''}`:'范围内暂无记录';
  }
  const result=insights.result;$('insights-output').hidden=!result;
  if(result){$('insights-provider').textContent=insightProvider.label;insightList('insights-themes',result.mainThemes);insightList('insights-patterns',result.repeatedPatterns);insightList('insights-attention',result.attentionPoints);insightList('insights-questions',result.reflectionQuestions);insightList('insights-actions',result.actionSuggestions);$('insights-disclaimer').textContent=result.disclaimer;$('insights-save-status').textContent=insights.saveMessage;}
}
function toggleInsights(source){
  const exiting=insights.active,returnScroll=insights.returnScroll;insightGenerationToken++;
  if(exiting&&insights.status==='loading')insights={...insights,status:'idle',analysis:null,result:null,error:'',saveMessage:''};
  if(!exiting)insights={...insights,returnScroll:window.scrollY};
  stopRecognition(true);insights=insightTransition(insights,'toggle');renderInsights();
  if(exiting)requestAnimationFrame(()=>{window.scrollTo({top:returnScroll,behavior:'auto'});commandFocus();});
  else requestAnimationFrame(()=>{commandFocus();$('insights-range-options').scrollIntoView({behavior:'auto',block:'center'});});
  if(!historyLoaded&&historyStatus!=='loading')void loadHistory();return true;
}
function scrollInsightContent(action,source){
  const overlay=$('insights-overlay'),distance=Math.max(240,overlay.clientHeight*.55),behavior=matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
  overlay.scrollBy({top:action==='right'?distance:-distance,behavior});$('insights-message').textContent=`${source} · 正在${action==='right'?'向下':'向上'}浏览洞察；短按旋钮可重新选择时间范围。`;return true;
}
function resetInsightRangeSelection(source){
  insightGenerationToken++;insights=insightTransition(insights,{type:'select-range',index:insights.rangeIndex});renderInsights();$('insights-message').textContent=`${source} · 已返回时间范围选择。`;
  const behavior=matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';$('insights-overlay').scrollTo({top:0,behavior});requestAnimationFrame(commandFocus);return true;
}
function performInsightAction(action,source){
  if(insights.status==='ready'&&['left','right'].includes(action))return scrollInsightContent(action,source);
  if(insights.status==='ready'&&action==='confirm')return resetInsightRangeSelection(source);
  if(['left','right'].includes(action)){insightGenerationToken++;insights=insightTransition(insights,action);renderInsights();$('insights-message').textContent=`${source} · 已选择${insightRanges[insights.rangeIndex].label}，短按旋钮生成。`;return true;}
  if(action==='confirm'){void generateInsight();return true;}
  return false;
}
async function generateInsight(){
  if(insights.status==='loading')return false;
  if(!historyLoaded){insights={...insights,status:'error',error:'历史记录尚未加载完成，请稍后重试。'};renderInsights();return false;}
  let analysis;try{analysis=analyzeHistory(historyRecords,insightRanges[insights.rangeIndex].days);}catch(error){insights={...insights,status:'error',error:`统计失败：${error?.message||'历史记录无效'}`};renderInsights();return false;}
  if(!analysis.sufficient){insights={...insights,status:'insufficient',analysis,result:null,error:'',saveMessage:'未调用 AI，也没有保存趋势性结论。'};renderInsights();return false;}
  const token=++insightGenerationToken;insights={...insights,status:'loading',analysis,result:null,error:'',saveMessage:''};renderInsights();
  try{
    const result=await requestInsight(insightProvider,buildInsightSummary(analysis));if(token!==insightGenerationToken||!insights.active)return false;
    insights={...insights,status:'ready',result,saveMessage:'正在保存到独立周期洞察存储…'};renderInsights();requestAnimationFrame(()=>{$('insights-statistics').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});commandFocus();});
    try{insightDatabase=insightDatabase||await openInsightDatabase();await saveInsightReport(insightDatabase,createInsightReport(analysis,result,insightProvider.id));if(token===insightGenerationToken){insights={...insights,saveMessage:'已独立保存；原始占卜历史未被修改。'};renderInsights();}}
    catch(error){if(token===insightGenerationToken){insights={...insights,saveMessage:`洞察已生成，但独立保存失败：${error?.message||'浏览器存储不可用'}。原始历史未受影响。`};renderInsights();}}
    return true;
  }catch(error){if(token!==insightGenerationToken)return false;insights={...insights,status:'error',result:null,error:`洞察生成失败：${error?.message||'接口暂时不可用'}。可以重试，原始历史不会改变。`,saveMessage:''};renderInsights();return false;}
}
function learningCard(){return cards[learning.index]||cards[0];}
function learningList(id,items){$(id).replaceChildren(...items.map(text=>{const item=document.createElement('li');item.textContent=text;return item;}));}
function renderLearningActionSelection(){
  const available=learning.detailOpen&&!learning.confirmed&&Boolean(learning.draft.trim()),buttons=[$('learning-clear'),$('learning-submit')];
  buttons.forEach((button,index)=>{const selected=available&&index===learningActionIndex;button.classList.toggle('selected',selected);button.setAttribute('aria-current',selected?'true':'false');});
}
function syncLearningDraftField(message=''){
  if(!learning.active||!learning.detailOpen||learning.confirmed)return false;
  const field=$('learning-draft'),value=field.value.slice(0,500),changed=value!==learning.draft;
  if(changed){learning=learningTransition(learning,{type:'set-draft',value},cards.length);learningActionIndex=1;saveLearning();$('learning-clear').disabled=!learning.draft;$('learning-submit').disabled=!learning.draft.trim();renderLearningActionSelection();$('learning-knob-context').textContent=learning.draft.trim()?'旋钮左右 · 选择清空或确认；短按执行':'旋钮左右 · 换牌并重新观察';}
  if(message&&changed)$('learning-status').textContent=message;
  return changed;
}
function settleLearningDraft(){
  if(!learning.active||!learning.detailOpen||learning.confirmed||!document.hasFocus())return false;
  const field=$('learning-draft');syncLearningDraftField('S3 语音转写已进入“我的理解”；确认以前仍可修改。');field.value=learning.draft;field.focus({preventScroll:true});field.setSelectionRange(field.value.length,field.value.length);field.scrollTop=field.scrollHeight;return true;
}
function restoreLearningDraftAfterExternalInput(){
  commandFocus();if(!learning.active)return;
  settleLearningDraft();setTimeout(settleLearningDraft,80);setTimeout(settleLearningDraft,240);
}
function renderLearning(){
  const card=learningCard(),knowledge=getCardKnowledge(card),open=learning.detailOpen,confirmed=learning.confirmed;
  $('learning-overlay').hidden=!learning.active;$('learning-toggle').setAttribute('aria-pressed',String(learning.active));
  document.body.classList.toggle('learning-active',learning.active);syncModalInert();
  if(!learning.active)return;
  $('learning-count').textContent=`${String(learning.index+1).padStart(2,'0')} / ${cards.length}`;$('learning-family').textContent=card.category;
  $('learning-card').dataset.family=card.category;$('learning-card').innerHTML=renderCardFace(card);
  $('learning-card-name').textContent=card.name;$('learning-card-en').textContent=card.en;$('learning-locked').hidden=open;$('learning-exercise').hidden=!open;
  $('learning-open').disabled=open;$('learning-open').innerHTML=open?'当前牌已打开 <kbd>短按</kbd>':'打开当前牌 <kbd>短按</kbd>';
  $('learning-draft').value=learning.draft;$('learning-draft').disabled=confirmed;$('learning-clear').disabled=confirmed||!learning.draft;$('learning-submit').disabled=confirmed||!learning.draft.trim();renderLearningActionSelection();
  $('learning-reference').hidden=!confirmed;$('learning-status').textContent=confirmed?'已确认。本页对照来自本地塔罗知识，不会调用付费模型。':'可以继续修改；确认后才显示参考解读。';
  $('learning-knob-context').textContent=open&&learning.draft.trim()?'旋钮左右 · 选择清空或确认；短按执行':open?'旋钮左右 · 换牌并重新观察':'旋钮左右 · 循环浏览 78 张牌';
  if(!confirmed)return;
  const comparison=compareLearningInterpretation(learning.draft,card,knowledge);
  learningList('learning-visuals',knowledge.visuals);$('learning-base').textContent=`${knowledge.archetype} · ${knowledge.element}元素 · ${knowledge.domain}`;
  $('learning-upright').textContent=knowledge.upright;$('learning-reversed').textContent=knowledge.reversed;$('learning-reflection').textContent=knowledge.reflection;
  $('learning-similar').textContent=comparison.similar;learningList('learning-missed',comparison.missedVisuals);$('learning-orientation-difference').textContent=comparison.orientationDifference;$('learning-next-question').textContent=comparison.nextQuestion;
}
function toggleLearning(source){
  const exiting=learning.active,returnScroll=learning.returnScroll;
  if(!exiting)learning={...learning,returnScroll:window.scrollY};
  stopRecognition(true);learning=learningTransition(learning,'toggle',cards.length);saveLearning();renderLearning();
  if(exiting){requestAnimationFrame(()=>{window.scrollTo({top:returnScroll,behavior:'auto'});commandFocus();});}
  else requestAnimationFrame(()=>{commandFocus();$('learning-card').scrollIntoView({behavior:'auto',block:'center'});});
  return true;
}
function focusLearningDraft(source){
  if(!learning.detailOpen){$('learning-status').textContent=`${source} · 先短按旋钮打开当前牌，再输入自己的理解。`;return false;}
  if(learning.confirmed){$('learning-status').textContent='本张对照已经确认；旋转到下一张牌可开始新的练习。';return false;}
  settleLearningDraft();$('learning-status').textContent=`${source} · 输入已定位到“我的理解”；确认以前仍可修改。`;return true;
}
function performLearningAction(action,source){
  if(action==='question')return focusLearningDraft(source);
  if(learning.detailOpen&&!learning.confirmed&&learning.draft.trim()&&['left','right'].includes(action)){
    learningActionIndex=action==='left'?0:1;renderLearningActionSelection();$('learning-knob-context').textContent=`已选择“${learningActionIndex===0?'清空':'确认并查看对照'}” · 短按旋钮执行`;$('learning-status').textContent=`${source} · 当前操作：${learningActionIndex===0?'清空草稿':'确认并查看对照'}。`;return true;
  }
  if(action==='confirm'&&learning.detailOpen){
    if(learning.confirmed){$('learning-status').textContent='本张对照已经显示；旋转到下一张牌可开始新的练习。';return false;}
    if(!learning.draft.trim()){$('learning-status').textContent='请先写下自己的理解，再短按旋钮确认。';settleLearningDraft();return false;}
    return learningActionIndex===0?clearLearningDraft():submitLearning();
  }
  if(!['left','right','confirm'].includes(action)){$('learning-status').textContent='学习模式中：旋钮浏览，短按打开，S3 输入，S6 返回占卜。';return false;}
  const next=learningTransition(learning,action,cards.length);if(next===learning)return false;learning=next;learningActionIndex=1;saveLearning();renderLearning();
  if(action==='confirm')requestAnimationFrame(()=>$('learning-draft').focus({preventScroll:true}));
  else requestAnimationFrame(commandFocus);
  return true;
}
function clearLearningDraft(){
  const next=learningTransition(learning,'clear',cards.length);if(next===learning)return false;learning=next;learningActionIndex=1;saveLearning();renderLearning();requestAnimationFrame(settleLearningDraft);return true;
}
function submitLearning(){
  const next=learningTransition(learning,'submit',cards.length);if(next===learning){$('learning-status').textContent=learning.confirmed?'参考对照已经显示，不会重复生成。':'请先写下自己的理解。';return false;}
  learning=next;saveLearning();renderLearning();requestAnimationFrame(()=>{commandFocus();$('learning-reference').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});return true;
}
function render(){
  const configuring=state.phase==='configuring',spreadSelecting=state.phase==='spread-selecting',selecting=state.phase==='selecting',revealed=state.phase==='revealed';
  $('spread-picker').hidden=!spreadSelecting;$('deck').hidden=!selecting;renderSpreadPicker();renderDeck();
  $('phase-label').textContent=state.phase==='idle'?'01 / 准备':configuring?'02 / 等待牌阵':spreadSelecting?'02 / 牌阵选择':selecting?'03 / 提问与抽牌':'04 / 牌阵揭晓';
  $('stage-title').textContent=state.phase==='idle'?'先留一点空白':configuring?'按 S2 选择牌阵':spreadSelecting?'选择问题需要的结构':selecting?'让牌停在直觉所在的位置':'牌阵已经完成';
  $('stage-hint').textContent=state.phase==='idle'?'按下 S1，开始这次占卜。':configuring?'按 S2 进入牌阵选择。':spreadSelecting?'旋转浏览牌阵，短按旋钮确认。':selecting?'按 S3 输入问题；确认后旋转牌组，短按逐张选牌。':'旋转旋钮或点击牌面，查看每张牌的信息。';
  const spread=currentSpread();
  $('selection-label').textContent=state.phase==='idle'?'等待开始':configuring?'等待 S2':spreadSelecting?`${state.spreadIndex+1} / ${spreads.length} · ${spreads[state.spreadIndex].name}`:selecting?`随机牌组 · 已选 ${state.picked.length} / ${spread.count}`:`${spread?.name||''} · ${state.results.length} 张`;
  $('knob-context').textContent=state.phase==='idle'||configuring?'旋钮待机':spreadSelecting?'旋钮左右 · 浏览牌阵':selecting?'旋钮左右 · 浏览牌背':readingMode?'旋钮左右 · 阅读长文':revealed?'旋钮左右 · 查看牌面':'旋钮待机';
  $('press-context').textContent=state.phase==='idle'?'按 S1 开始':configuring?'按 S2 选择牌阵':spreadSelecting?'短按 · 确认牌阵':selecting&&!state.question?'短按 · 确认问题':selecting?`短按 · 选中第 ${state.picked.length+1} 张`:revealed?'S4 综合解读':'短按确认';
  $('previous').disabled=!(spreadSelecting||selecting||revealed);$('next').disabled=!(spreadSelecting||selecting||revealed);
  $('main-label').textContent=state.phase==='idle'?'开始':configuring?'进入牌阵选择':spreadSelecting?'确认此牌阵':selecting&&!state.question?'确认问题':selecting?`选中这张 · ${state.picked.length+1}/${spread.count}`:'开始新一次';
  $('main-key').textContent=state.phase==='idle'||revealed?'开始':configuring?'牌阵选择':'Enter';
  $('current-setup').textContent=spread?`当前牌阵：${spread.name} · ${spread.count} 张 · 随机 78 张牌组`:spreadSelecting?`当前指向：${spreads[state.spreadIndex].name} · ${spreads[state.spreadIndex].count} 张`:configuring?'按 S2 进入牌阵选择。':'牌阵尚未选择。';
  $('current-setup').classList.toggle('confirmed',Boolean(spread));$('current-question').textContent=state.question?`本次问题：${state.question}`:'尚未确认问题。语音识别文字只有确认后才会进入本次占卜。';$('current-question').classList.toggle('confirmed',Boolean(state.question));updateQuestionControls();
  $('result-overlay').hidden=!revealed;if(revealed){renderResult();renderReading();}renderLearning();
}
function dispatch(action,source){
  const previous=state,next=transition(state,action);
  if(next===state){$('stage-message').textContent=state.phase==='revealed'?'结果已锁定；旋转只切换牌面说明，S1 开始新一轮。':state.phase==='idle'?'按 S1 开始。':state.phase==='configuring'?'按 S2 进入牌阵选择。':'当前动作不可用。';return false;}
  state=next;saveState();if(action==='start'&&previous.phase==='revealed'){$('question-draft').value='';resultFocus=0;readingMode=false;clearReadingSession();}if(state.phase==='revealed'&&previous.phase!=='revealed'){readingSession=null;readingStatus='idle';readingError='';readingMode=false;}render();
  if(state.phase==='configuring'){setQuestionStatus('idle','按 S2 进入牌阵选择。');commandFocus();}
  else if(state.phase==='spread-selecting'){
    $('stage-message').textContent=`${source} · 旋转选择牌阵，短按确认。`;
    setTimeout(()=>{commandFocus();document.querySelector('.workspace').scrollIntoView({behavior:'auto',block:'start'});},80);
  }
  else if(state.phase==='selecting'&&previous.phase==='spread-selecting'){
    $('stage-message').textContent=`${source} · ${currentSpread().name}已确认，78 张牌已随机洗牌。`;
    setQuestionStatus('idle','问题框已聚焦。现在按 S3 说话，转写会直接进入这里。');$('question-draft').focus();
    setTimeout(()=>$('question-draft').scrollIntoView({behavior:'auto',block:'center'}),80);
  }
  else if(state.phase==='selecting'&&state.picked.length>previous.picked.length)$('stage-message').textContent=`${source} · 已选第 ${state.picked.length} 张，还需要 ${currentSpread().count-state.picked.length} 张。`;
  else if(state.phase==='revealed'){$('stage-message').textContent=`${currentSpread().name}已完成。${storageAvailable?'刷新后仍保留。':'浏览器未允许保存，请勿刷新。'}`;setQuestionStatus('idle','本次问题和牌阵已经锁定。');commandFocus();}
  else if(state.phase==='selecting'&&['left','right'].includes(action)){
    showDeckMotion(action);$('stage-message').textContent=`${source} · 向${action==='right'?'右':'左'}切换牌背。`;
  }
  else $('stage-message').textContent=`${source} · 已切换当前牌背。`;return true;
}
function openSetup(source){if(state.phase==='configuring')return dispatch('setup',source);if(state.phase==='spread-selecting')return true;if(state.phase==='selecting')return focusQuestion();$('stage-message').textContent=state.phase==='idle'?'先按 S1 开始。':'按 S1 开始新一轮后再选择牌阵。';return false;}
function showResultStep(action){if(state.phase!=='revealed'||!['left','right'].includes(action))return false;if(scrollReadingContent(action))return true;resultFocus=(resultFocus+(action==='left'?-1:1)+state.results.length)%state.results.length;renderResultDetail();return true;}
function performAction(action,source){if(action==='insights')return toggleInsights(source);if(insights.active)return performInsightAction(action,source);if(action==='learning')return toggleLearning(source);if(learning.active)return performLearningAction(action,source);if(action==='history')return toggleHistoryTool(source);if(historyToolOpen&&['left','right'].includes(action))return moveHistoryTool(action,source);if(historyToolOpen&&action==='confirm')return confirmHistoryTool(source);if(historyToolOpen)setHistoryToolOpen(false,source);if(action==='start')playGreeting();if(action==='setup')return openSetup(source);if(action==='reading')return enterReading(source);if(action==='question')return state.phase==='revealed'?focusFollowUp(source):focusQuestion();if(action==='confirm'&&state.phase==='selecting'&&!state.question)return confirmQuestion(source);if(showResultStep(action))return true;if(action==='confirm'&&document.activeElement===$('follow-up')){void sendFollowUp();return true;}if(action==='confirm'&&document.activeElement===$('question-draft'))return confirmQuestion(source);return dispatch(action,source);}
function mainAction(){if(state.phase==='idle'||state.phase==='revealed')return 'start';if(state.phase==='configuring')return 'setup';return 'confirm';}
$('main-action').addEventListener('click',()=>performAction(mainAction(),'鼠标／触控'));
$('question-action').addEventListener('click',()=>performAction('question','鼠标／触控'));
$('previous').addEventListener('click',()=>performAction('left','鼠标／触控'));
$('next').addEventListener('click',()=>performAction('right','鼠标／触控'));
$('new-round').addEventListener('click',()=>performAction('start','鼠标／触控'));
$('learning-toggle').addEventListener('click',()=>performAction('learning','鼠标／触控'));
$('insights-toggle').addEventListener('click',()=>performAction('insights','鼠标／触控'));
$('insights-exit').addEventListener('click',()=>performAction('insights','鼠标／触控'));
$('insights-generate').addEventListener('click',()=>performAction('confirm','鼠标／触控'));
$('insights-retry').addEventListener('click',()=>generateInsight());
for(const button of $('insights-range-options').children)button.addEventListener('click',()=>{insightGenerationToken++;insights=insightTransition(insights,{type:'select-range',index:Number(button.dataset.rangeIndex)});renderInsights();});
$('learning-exit').addEventListener('click',()=>performAction('learning','鼠标／触控'));
$('learning-previous').addEventListener('click',()=>performAction('left','鼠标／触控'));
$('learning-next').addEventListener('click',()=>performAction('right','鼠标／触控'));
$('learning-open').addEventListener('click',()=>performAction('confirm','鼠标／触控'));
$('learning-draft').addEventListener('input',event=>{if(consumeModeCommand($('learning-draft')))return;if(syncLearningDraftField())learningActionIndex=1;renderLearningActionSelection();$('learning-knob-context').textContent=learning.draft.trim()?'旋钮左右 · 选择清空或确认；短按执行':'旋钮左右 · 换牌并重新观察';if(!event.isComposing)$('learning-status').textContent='可以继续修改；确认后才显示参考解读。';});
$('learning-draft').addEventListener('compositionend',()=>requestAnimationFrame(settleLearningDraft));
$('learning-draft').addEventListener('change',()=>requestAnimationFrame(settleLearningDraft));
$('learning-clear').addEventListener('click',clearLearningDraft);
$('learning-submit').addEventListener('click',submitLearning);
function receiveFixedText(value){
  const command=fixedTextAction(value);if(!command)return false;$('command-input').value='';$('learning-command-input').value='';$('insights-command-input').value='';received++;accepted++;
  const meta={start:['1','开始'],setup:['2','牌阵选择'],reading:['4','综合解读'],history:['5','历史备份'],learning:['6','学习模式'],insights:['7','周期洞察']}[command],outcome=$('test-only').checked?'仅测试，不改变流程':performAction(command,`EasyInput S${meta[0]}`)?'执行成功':'状态锁定／条件未满足';
  logs.unshift(`${new Date().toLocaleTimeString('zh-CN',{hour12:false})}  S${meta[0]}“${meta[1]}”  → ${outcome}`);logs=logs.slice(0,20);updateLog();return true;
}
function consumeModeCommand(field){
  const match=field.value.match(/(?:(?:S6\s*)?学习\s*模式|(?:S7\s*)?周期\s*洞察)\s*$/);if(!match)return false;
  const command=/周期/.test(match[0])?'周期洞察':'学习模式';field.value=field.value.slice(0,match.index);return receiveFixedText(command);
}
function consumeFollowUpCommand(field){
  if(consumeModeCommand(field))return true;
  const value=field.value,normalized=value.replaceAll(/\s/g,'');
  if(!['综合解读','S4综合解读','历史备份','S5历史备份'].includes(normalized))return false;
  field.value='';return receiveFixedText(value);
}
function routeCommandInput(field=$('command-input')){
  const value=field.value;if(!value)return false;if(receiveFixedText(value))return true;
  if(insights.active){field.value='';renderInsights();return false;}
  if(learning.active){field.value='';if(!learning.detailOpen||learning.confirmed){renderLearning();return false;}learning=learningTransition(learning,{type:'set-draft',value:learning.draft+value},cards.length);saveLearning();renderLearning();$('learning-draft').focus({preventScroll:true});$('learning-status').textContent='S3 语音转写已进入“我的理解”；确认以前仍可修改。';return true;}
  if(state.phase!=='revealed'||!readingSession)return false;
  readingMode=true;$('follow-up').value=($('follow-up').value+value).slice(0,maxQuestionLength);$('command-input').value='';$('follow-up').focus({preventScroll:true});scrollReadingIntoView($('follow-up'));$('ai-reading-status').textContent='S3 语音转写已进入追问框。核对后短按旋钮发送。';return true;
}
$('command-input').addEventListener('input',()=>routeCommandInput($('command-input')));
$('learning-command-input').addEventListener('input',()=>routeCommandInput($('learning-command-input')));
$('insights-command-input').addEventListener('input',()=>routeCommandInput($('insights-command-input')));
let observedCommandValue='',observedLearningCommandValue='',observedInsightsCommandValue='',observedFollowUpValue='';
setInterval(()=>{
  const commandValue=$('command-input').value;if(commandValue&&commandValue===observedCommandValue)routeCommandInput($('command-input'));observedCommandValue=$('command-input').value;
  const learningCommandValue=$('learning-command-input').value;if(learningCommandValue&&learningCommandValue===observedLearningCommandValue)routeCommandInput($('learning-command-input'));observedLearningCommandValue=$('learning-command-input').value;
  const insightsCommandValue=$('insights-command-input').value;if(insightsCommandValue&&insightsCommandValue===observedInsightsCommandValue)routeCommandInput($('insights-command-input'));observedInsightsCommandValue=$('insights-command-input').value;
  const learningDraftValue=$('learning-draft').value;if(learning.active&&learning.detailOpen&&!learning.confirmed&&learningDraftValue!==learning.draft)syncLearningDraftField('S3 语音转写已进入“我的理解”；确认以前仍可修改。');
  const followUp=$('follow-up'),followUpValue=followUp.value;if(state.phase==='revealed'&&readingSession&&followUpValue&&followUpValue!==observedFollowUpValue&&!consumeFollowUpCommand(followUp)){readingMode=true;followUp.focus({preventScroll:true});scrollReadingIntoView(followUp);$('ai-reading-status').textContent='S3 语音转写已进入追问框。核对后短按旋钮发送。';}observedFollowUpValue=followUp.value;
},120);
document.addEventListener('paste',event=>{
  if(!acceptsHardwareCommand()||event.target===$('question-draft'))return;
  const text=event.clipboardData?.getData('text/plain')||'';if(receiveFixedText(text))event.preventDefault();
});
$('browser-listen').addEventListener('click',startRecognition);
$('stop-listening').addEventListener('click',()=>{stopRecognition();setQuestionStatus('stopped',$('question-draft').value.trim()?'聆听已停止。可以修改文字，再确认问题。':'聆听已停止。可以重试或直接输入问题。');});
$('clear-question').addEventListener('click',()=>{stopRecognition(true);$('question-draft').value='';setQuestionStatus('stopped','问题文字已清空，当前占卜中的已确认问题不会改变。');$('question-draft').focus();});
$('question-draft').addEventListener('input',()=>{if(consumeModeCommand($('question-draft')))return;if(questionStatus!=='listening')setQuestionStatus($('question-draft').value.trim()?'reviewing':'stopped',$('question-draft').value.trim()?'可以继续修改；短按旋钮或点击确认后才会写入本次占卜。':'尚无问题文字。可以按 S3 语音输入，或直接打字。');});
function confirmQuestion(source){
  const value=$('question-draft').value.trim();if(!value){$('stage-message').textContent=`${source} · 请先输入并确认问题。`;setQuestionStatus('stopped','还没有问题文字。请先按 S3 说话，或直接输入。');commandFocus();return false;}
  stopRecognition(true);const next=transition(state,{type:'set-question',value});if(next!==state){state=next;saveState();render();}
  $('stage-message').textContent=`${source} · 问题已确认。现在旋转并短按选择第 1 张牌。`;setQuestionStatus('idle','问题已写入本次占卜。现在旋转选择牌背，再短按旋钮选牌。');document.activeElement?.blur?.();commandFocus();scrollToDeck();return true;
}
$('confirm-question').addEventListener('click',()=>confirmQuestion('鼠标／触控'));
$('generate-reading').addEventListener('click',()=>enterReading('鼠标／触控'));
$('send-follow-up').addEventListener('click',sendFollowUp);
$('follow-up').addEventListener('input',()=>{if(consumeFollowUpCommand($('follow-up')))return;if(readingMode&&$('follow-up').value.trim())scrollReadingIntoView($('follow-up'));});
$('history-tool-toggle').addEventListener('click',()=>toggleHistoryTool('鼠标／触控'));
$('history-export').addEventListener('click',()=>{historyToolIndex=0;renderHistoryTool();exportHistory();});
$('history-restore').addEventListener('click',()=>{historyToolIndex=1;renderHistoryTool();$('history-import').click();});
$('history-import').addEventListener('change',importHistory);
$('history-retry').addEventListener('click',retryHistory);
$('history-close').addEventListener('click',()=>{selectedHistoryId=null;renderHistory();});
$('show-input').addEventListener('click',()=>{const open=$('input-panel').hidden;$('input-panel').hidden=!open;$('show-input').setAttribute('aria-expanded',String(open));if(open)$('input-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});});
const codes=[...Array.from({length:8},(_,i)=>'Digit'+(i+1)),'ArrowLeft','ArrowRight','Enter'];
for(const code of codes){const key=document.createElement('div');key.className='monitor-key';key.dataset.code=code;key.innerHTML=`${code.startsWith('Digit')?code.slice(-1):code==='ArrowLeft'?'←':code==='ArrowRight'?'→':'Enter'}<small>0 次</small>`;$('key-monitor').append(key);}
function updateLog(){
  $('input-counts').textContent=`收到 ${received} 次 · 接受 ${accepted} 次 · 忽略重复 ${duplicates} 次`;const nodes=logs.map(line=>{const li=document.createElement('li');li.textContent=line;return li;});
  if(!nodes.length){const li=document.createElement('li');li.className='log-empty';li.textContent='还没有输入记录';nodes.push(li);}$('event-log').replaceChildren(...nodes);
}
document.addEventListener('keydown',event=>{
  const interactive=event.target.closest('button,a,input,textarea,select,summary,[contenteditable="true"]');
  if(acceptsHardwareCommand()&&![$('command-input'),$('learning-command-input'),$('insights-command-input')].includes(document.activeElement)&&!interactive&&!event.ctrlKey&&!event.metaKey&&!event.altKey)commandFocus();
},true);
document.addEventListener('keydown',event=>{
  const interactive=event.target.closest('button,a,input,textarea,select,[contenteditable="true"],summary'),questionConfirm=interactive?.id==='question-draft'&&['Enter','NumpadEnter'].includes(event.code),questionShortcut=interactive?.id==='question-draft'&&['Digit3','Numpad3'].includes(event.code),followUpConfirm=interactive?.id==='follow-up'&&['Enter','NumpadEnter'].includes(event.code),followUpShortcut=interactive?.id==='follow-up'&&['Digit3','Numpad3'].includes(event.code),followUpScroll=interactive?.id==='follow-up'&&['ArrowLeft','ArrowRight'].includes(event.code),learningShortcut=interactive?.id==='learning-draft'&&['Digit3','Numpad3'].includes(event.code),learningKnobChoice=interactive?.id==='learning-draft'&&['ArrowLeft','ArrowRight'].includes(event.code),learningKnobConfirm=interactive?.id==='learning-draft'&&['Enter','NumpadEnter'].includes(event.code),modeToggleShortcut=['command-input','learning-command-input','insights-command-input'].includes(interactive?.id)&&['Digit6','Numpad6','Digit7','Numpad7'].includes(event.code),historyShortcut=interactive?.id==='command-input'&&['Digit5','Numpad5'].includes(event.code),commandKey=['command-input','learning-command-input','insights-command-input'].includes(interactive?.id);
  if(interactive&&interactive.id!=='test-only'&&!questionConfirm&&!questionShortcut&&!followUpConfirm&&!followUpShortcut&&!followUpScroll&&!learningShortcut&&!learningKnobChoice&&!learningKnobConfirm&&!modeToggleShortcut&&!historyShortcut&&!commandKey)return;const input=keyInput(event,held);if(!input)return;event.preventDefault();received++;let outcome;
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
window.addEventListener('focus',()=>{focusStatus();restoreLearningDraftAfterExternalInput();});
document.addEventListener('visibilitychange',()=>{focusStatus();if(!document.hidden)restoreLearningDraftAfterExternalInput();});
document.addEventListener('pointerup',event=>{if(['idle','configuring'].includes(state.phase)&&!event.target.closest('button,a,input,textarea,select,summary,[contenteditable="true"]'))requestAnimationFrame(commandFocus);});
$('clear-log').addEventListener('click',()=>{received=accepted=duplicates=0;logs=[];hits.clear();for(const tile of $('key-monitor').children)tile.querySelector('small').textContent='0 次';updateLog();});
$('provider-badge').textContent=readingProvider===apiReadingProvider?'安全服务端接口 · 密钥仅在服务端':'视觉线索模拟接口 · 零模型费用';
$('question-draft').value=state.question||'';if(state.phase==='revealed')loadReadingSession();render();renderHistory();renderInsights();void loadHistory();focusStatus();
if(learning.active)commandFocus();
else{
  if(state.phase==='configuring'){setQuestionStatus('idle','按 S2 进入牌阵选择。');commandFocus();}
  if(state.phase==='spread-selecting')setQuestionStatus('idle','旋转选择牌阵，短按旋钮确认。');
  if(state.phase==='selecting'){
    setQuestionStatus(state.question?'idle':'stopped',state.question?'问题已写入本次占卜；旋转选择牌背，再短按旋钮选牌。':'问题框可用。按 S3 说话，或直接输入。');
    if(state.question)document.activeElement?.blur?.();else $('question-draft').focus();
  }
  if(state.phase==='revealed'){setQuestionStatus('idle','本次问题和牌阵已经锁定。');$('stage-message').textContent='已恢复本次牌阵结果。旋转可查看每张牌的信息。';commandFocus();}
  if(state.phase==='idle')commandFocus();
}
if(greetingPlayed)$('greeting-status').textContent='启动语已在本标签页播放过。';
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController(),tools=[
    {name:'read_tarot_state',description:'读取当前牌阵、随机牌组进度和已确认结果。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({...state})},
    {name:'control_tarot_draw',description:'开始、进入牌阵选择、旋转或确认当前项目。',inputSchema:{type:'object',properties:{action:{type:'string',enum:['start','setup','left','right','confirm']}},required:['action'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{if(!input||Object.keys(input).length!==1||!['start','setup','left','right','confirm'].includes(input.action))throw new Error('无效动作');return {changed:performAction(input.action,'网页工具'),...state};}}
  ];for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}window.addEventListener('pagehide',event=>{if(!event.persisted)lifecycle.abort();});
}
