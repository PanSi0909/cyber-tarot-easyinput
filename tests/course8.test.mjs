import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fresh,transition,keyInput,fixedTextAction} from '../dist/core.mjs';

const read=name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8');

test('八个备用数字键与旋钮键形成无冲突动作表',()=>{
  const expected=['start','setup','question','reading','history','learning','insights','back'];
  for(const prefix of ['Digit','Numpad'])expected.forEach((action,index)=>assert.equal(keyInput({code:`${prefix}${index+1}`},new Set()).action,action));
  assert.equal(keyInput({code:'Escape'},new Set()).action,'back');
  assert.equal(keyInput({code:'ArrowLeft'},new Set()).action,'left');
  assert.equal(keyInput({code:'ArrowRight'},new Set()).action,'right');
  assert.equal(keyInput({code:'Enter'},new Set()).action,'confirm');
});

test('八键固定职责保留既有名称并新增 S8 返回',()=>{
  assert.deepEqual(['开始','牌阵选择','综合解读','历史备份','学习模式','周期洞察','返回'].map(fixedTextAction),['start','setup','reading','history','learning','insights','back']);
});

test('S8 状态回退只作用于未确认步骤',()=>{
  const idle=fresh(),started=transition(idle,'start'),choosing=transition(started,'setup'),selecting=transition(choosing,'confirm',()=>0.5),asked=transition(selecting,{type:'set-question',value:'这个问题已经确认'}),revealed=transition(asked,'confirm');
  assert.equal(transition(started,'back').phase,'idle');
  assert.equal(transition(choosing,'back').phase,'configuring');
  assert.equal(transition(selecting,'back').phase,'spread-selecting');
  assert.equal(transition(asked,'back'),asked);
  assert.equal(transition(revealed,'back'),revealed);
});

test('S8、模式优先级和鼠标返回共用统一动作入口',()=>{
  const app=read('dist/app.mjs'),html=read('dist/index.html');
  assert.match(app,/function performBackAction\(source\)/);
  assert.match(app,/if\(action==='back'\)return performBackAction\(source\)/);
  const router=app.match(/function performAction\(action,source\)\{[\s\S]*?\n\}/)?.[0]||'';
  assert.ok(router.indexOf("if(action==='back')")<router.indexOf('if(insights.active)'));
  assert.match(app,/if\(insights\.active\)return action==='insights'\?toggleInsights\(source\):performInsightAction\(action,source\)/);
  assert.match(app,/if\(learning\.active\)return action==='learning'\?toggleLearning\(source\):performLearningAction\(action,source\)/);
  for(const id of ['back-action','insights-exit','learning-exit','history-close'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(app,/\$\('back-action'\)\.addEventListener\('click',\(\)=>performAction\('back','鼠标／触控'\)\)/);
  assert.match(app,/\$\('insights-exit'\)\.addEventListener\('click',\(\)=>performAction\('back','鼠标／触控'\)\)/);
  assert.match(app,/\$\('learning-exit'\)\.addEventListener\('click',\(\)=>performAction\('back','鼠标／触控'\)\)/);
  assert.match(app,/\$\('history-close'\)\.addEventListener\('click',\(\)=>performAction\('back','鼠标／触控'\)\)/);
});

test('综合解读可收起且恢复入口不会改变锁定结果',()=>{
  const app=read('dist/app.mjs');
  assert.match(app,/function collapseReading\(source\)\{if\(!readingMode\)return false;readingMode=false;renderReading\(\)/);
  assert.match(app,/\$\('ai-output'\)\.hidden=!ready\|\|!readingMode/);
  assert.match(app,/ready\?'查看综合解读'/);
  assert.match(app,/if\(readingSession\)\{renderReading\(\);primeFollowUpTarget\(\);\}/);
});

test('结果浮层中顶部鼠标入口仍保持可见可点',()=>{
  const styles=read('dist/styles.css');
  assert.match(styles,/\.topbar\{position:sticky;top:0;z-index:1100/);
  assert.match(styles,/\.result-overlay\{position:fixed;inset:0;z-index:1000/);
});

test('应用引用的页面元素 ID 全部存在',()=>{
  const app=read('dist/app.mjs'),html=read('dist/index.html'),ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1])),referenced=new Set([...app.matchAll(/\$\('([^']+)'\)/g)].map(match=>match[1]));
  assert.deepEqual([...referenced].filter(id=>!ids.has(id)),[]);
});

test('输入验证面板正确区分 Escape 与 Enter',()=>{
  const app=read('dist/app.mjs');
  assert.match(app,/code==='Escape'\?'Esc'/);
});

test('结课材料包含键位、状态、AI 边界、演示与主对话待办',()=>{
  const guide=read('dist/guide.html'),delivery=read('COURSE-8-DELIVERY.md');
  assert.match(guide,/S8 返回 \/ 取消/);
  for(const heading of ['最终键位表','输入优先级与状态流转','AI、mock 与安全接口边界','3–5 分钟演示路线','必须由主对话完成','已知限制与后续接口'])assert.match(delivery,new RegExp(heading));
  assert.match(delivery,/productionEnabled=false/);
  assert.match(delivery,/没有配置真实密钥、没有发起真实模型调用/);
});
