import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cards,fresh} from '../dist/core.mjs';
import {getCardKnowledge} from '../dist/tarot-knowledge.mjs';
import {freshLearning,learningTransition,serializeLearning,restoreLearning,compareLearningInterpretation} from '../dist/learning.mjs';

test('学习模式可循环浏览完整 78 张牌',()=>{
  let state=learningTransition(freshLearning(),'toggle',cards.length);
  assert.equal(learningTransition(state,'left',cards.length).index,77);
  state={...state,index:77};assert.equal(learningTransition(state,'right',cards.length).index,0);
  assert.equal(cards.length,78);
});

test('短按只打开当前牌，换牌会清除详情临时状态',()=>{
  let state=learningTransition(freshLearning(),'toggle');state=learningTransition(state,'confirm');
  assert.equal(state.detailOpen,true);assert.equal(state.index,0);
  state=learningTransition(state,{type:'set-draft',value:'我的理解'});state=learningTransition(state,'right');
  assert.deepEqual({index:state.index,detailOpen:state.detailOpen,draft:state.draft,confirmed:state.confirmed},{index:1,detailOpen:false,draft:'',confirmed:false});
});

test('自行解读确认前可编辑，确认后只生成一次对照',()=>{
  let state=learningTransition(learningTransition(freshLearning(),'toggle'),'confirm');
  state=learningTransition(state,{type:'set-draft',value:'第一次'});state=learningTransition(state,{type:'set-draft',value:'第二次'});
  assert.equal(state.draft,'第二次');state=learningTransition(state,'submit');assert.equal(state.confirmed,true);
  assert.equal(learningTransition(state,'submit'),state);assert.equal(learningTransition(state,{type:'set-draft',value:'不能覆盖'}),state);
});

test('刷新只恢复学习位置和详情，草稿与对照结果清除',()=>{
  let state=learningTransition(learningTransition(freshLearning(),'toggle'),'confirm');
  state=learningTransition(state,{type:'set-draft',value:'临时草稿'});state=learningTransition(state,'submit');state={...state,index:23,returnScroll:640};
  const restored=restoreLearning(serializeLearning(state));
  assert.deepEqual(restored,{active:true,index:23,detailOpen:true,draft:'',confirmed:false,returnScroll:640});
  assert.deepEqual(restoreLearning('{broken'),freshLearning());
});

test('本地参考对照包含相近理解、遗漏线索、正逆位与反思问题',()=>{
  const card=cards.find(item=>item.id==='major-fool'),knowledge=getCardKnowledge(card),comparison=compareLearningInterpretation('我看到新的开始，也想到自由。',card,knowledge);
  assert.match(comparison.similar,/新的开始|自由/);assert.ok(comparison.missedVisuals.length);assert.match(comparison.orientationDifference,/正位：.*逆位：/);assert.equal(comparison.nextQuestion,knowledge.reflection);
});

test('学习状态变更不修改占卜会话对象',()=>{
  const divination=fresh(),snapshot=structuredClone(divination);let learning=learningTransition(freshLearning(),'toggle');
  learning=learningTransition(learning,'right');learning=learningTransition(learning,'confirm');
  assert.deepEqual(divination,snapshot);assert.equal(learning.active,true);
});

test('学习页面提供鼠标、旋钮和自行解读入口，参考区默认隐藏',()=>{
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  for(const id of ['learning-toggle','learning-exit','learning-command-input','learning-previous','learning-next','learning-open','learning-draft','learning-submit','learning-reference'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/id="learning-toggle"[^>]*>学习模式<\/button>/);assert.match(html,/id="learning-reference"[^>]*hidden/);assert.match(html,/本地知识 · 零模型费用/);
});

test('学习模式使用独立指令接收区并保持紧凑非悬浮页头',()=>{
  const app=readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8'),styles=readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');
  assert.match(app,/learning\.detailOpen&&!learning\.confirmed\?\$\('learning-draft'\):\$\('learning-command-input'\)/);
  assert.match(app,/function settleLearningDraft\(\)/);assert.match(app,/restoreLearningDraftAfterExternalInput/);
  assert.match(app,/learningDraftValue!==learning\.draft\)syncLearningDraftField/);
  assert.match(styles,/\.learning-header\{position:relative/);
  assert.doesNotMatch(styles,/\.learning-header\{position:sticky/);
});

test('综合解读后的追问框会从普通输入和系统写入两条路径识别 S6',()=>{
  const app=readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8');
  assert.match(app,/function consumeFollowUpCommand\(field\)/);
  assert.match(app,/followUpValue!==observedFollowUpValue&&!consumeFollowUpCommand\(followUp\)/);
  assert.match(app,/\$\('follow-up'\)\.addEventListener\('input',\(\)=>\{if\(consumeFollowUpCommand\(\$\('follow-up'\)\)\)return/);
});

test('顶部学习模式与使用手册使用相同高度和底线',()=>{
  const styles=readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');
  assert.match(styles,/\.topbar \.utility-nav\{[^}]*align-items:flex-end/);
  assert.match(styles,/\.topbar \.utility-nav a,\.topbar \.utility-nav button\{[^}]*min-height:34px[^}]*padding:0 0 7px/);
});

test('直接打开本地文件会进入 HTTP 预览，学习确认支持旋钮选择和短按',()=>{
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),app=readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8'),styles=readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');
  assert.match(html,/location\.protocol==='file:'\)location\.replace\('http:\/\/127\.0\.0\.1:4173\/'\)/);
  assert.match(app,/learningActionIndex=action==='left'\?0:1/);assert.match(app,/return learningActionIndex===0\?clearLearningDraft\(\):submitLearning\(\)/);
  assert.match(app,/learningKnobChoice=interactive\?\.id==='learning-draft'&&\['ArrowLeft','ArrowRight'\]\.includes\(event\.code\)/);
  assert.match(app,/learningKnobConfirm=interactive\?\.id==='learning-draft'&&\['Enter','NumpadEnter'\]\.includes\(event\.code\)/);
  assert.match(app,/modeToggleShortcut=\['command-input','learning-command-input','insights-command-input'\]\.includes\(interactive\?\.id\)&&\['Digit6','Numpad6','Digit7','Numpad7'\]\.includes\(event\.code\)/);
  assert.match(styles,/\.learning-actions button\.selected\{/);
});

test('牌面 V2 封存清单覆盖 78 张稳定 ID 且未启用生产映射',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../design/card-art-v2-manifest.json',import.meta.url),'utf8'));
  const catalog=Object.values(manifest.catalog).flat();assert.equal(catalog.length,78);assert.equal(new Set(catalog).size,78);assert.deepEqual(new Set(catalog),new Set(cards.map(card=>card.id)));
  const assets=[...manifest.pilotCards,...manifest.batch01Cards,...manifest.batch02Cards,...manifest.batch03Cards];
  assert.equal(manifest.productionEnabled,false);assert.equal(manifest.pilotCards.length,8);assert.equal(manifest.summary.assets,assets.length);assert.equal(manifest.summary.pending,manifest.summary.total-assets.length);
});
