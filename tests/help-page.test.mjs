import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const dist=new URL('../dist/',import.meta.url);

test('主操作页不再混入完整使用流程，并提供独立手册入口',async()=>{
  const html=await readFile(new URL('index.html',dist),'utf8');
  assert.doesNotMatch(html,/class="section-banner"|class="control-strip"/);
  assert.match(html,/href="guide\.html"[^>]*>使用手册/);
});

test('独立使用手册集中包含流程、牌阵、牌面、历史、学习模式与周期洞察说明',async()=>{
  const html=await readFile(new URL('guide.html',dist),'utf8');
  for(const heading of ['快速开始','按键与旋钮','四种牌阵','牌面与正逆位','解读、追问与历史','学习模式','周期洞察'])assert.match(html,new RegExp(heading));
  assert.match(html,/路径A、路径A结果、路径B、路径B结果/);
  assert.match(html,/返回占卜台/);
});

test('五牌选择缩略图不再渲染解释性文字',async()=>{
  const app=await readFile(new URL('app.mjs',dist),'utf8');
  assert.doesNotMatch(app,/marker\.dataset\.label|data-label/);
});

test('未确认问题时短按始终回到问题确认，不会误报抽牌动作不可用',async()=>{
  const app=await readFile(new URL('app.mjs',dist),'utf8');
  assert.match(app,/state\.phase==='selecting'&&!state\.question\)\{\$\('question-draft'\)\.focus/);
  assert.match(app,/action==='confirm'&&state\.phase==='selecting'&&!state\.question\)return confirmQuestion\(source\)/);
  assert.match(app,/selecting&&!state\.question\?'确认问题':selecting\?`选中这张/);
});
