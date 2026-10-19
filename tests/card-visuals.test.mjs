import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {cards} from '../dist/core.mjs';
import {pilotCardIds,renderCardBack,renderCardFace,renderPilotCardFace} from '../dist/card-visuals.mjs';

test('牌背使用对称仪式纹样且不包含卡牌身份',()=>{
  const markup=renderCardBack();
  assert.match(markup,/card-back-art/);
  assert.match(markup,/back-eclipse/);
  for(const card of cards)assert.doesNotMatch(markup,new RegExp(card.name));
});

test('78 张生产牌面只保留英文牌名且正逆位共用同一张插画',()=>{
  assert.equal(cards.length,78);
  for(const card of cards){
    const upright=renderCardFace(card,'upright'),reversed=renderCardFace(card,'reversed');
    assert.match(upright,/card-face-visual production-v2/);
    assert.match(upright,new RegExp(card.en));
    assert.doesNotMatch(upright,new RegExp(card.name));
    assert.doesNotMatch(upright,new RegExp(card.keywords));
    assert.doesNotMatch(upright,/face-number|face-orientation|↑ 正位|↓ 逆位/);
    assert.match(reversed,/orientation-reversed/);
    assert.match(upright,new RegExp(`cards-v2-web/${card.id}\\.jpg`));
    assert.match(reversed,new RegExp(`cards-v2-web/${card.id}\\.jpg`));
    assert.notEqual(upright,reversed);
  }
});

test('22 张大牌和 56 张小牌逐张使用独立 V2 资产',()=>{
  const majors=cards.filter(card=>card.id.startsWith('major-'));
  const minors=cards.filter(card=>!card.id.startsWith('major-'));
  assert.equal(majors.length,22);
  assert.equal(minors.length,56);
  const paths=cards.map(card=>renderCardFace(card).match(/--art:url\('([^']+)'\)/)?.[1]);
  assert.equal(new Set(paths).size,78);
  assert.ok(paths.every(path=>path?.includes('/cards-v2-web/')));
});

test('首批八张样卡使用独立叙事资产，不叠加机械花色符号',()=>{
  assert.equal(pilotCardIds.length,8);
  for(const id of pilotCardIds){
    const card=cards.find(item=>item.id===id),markup=renderPilotCardFace(card);
    assert.match(markup,/bespoke-illustration/);
    assert.doesNotMatch(markup,/pip-constellation|court-seal/);
    assert.match(markup,new RegExp(`cards/${id}\\.jpg`));
  }
});

test('生产牌面只引用项目内原创资产且文件完整',()=>{
  const markup=cards.map(card=>renderCardFace(card)).join('');
  const paths=[...new Set([...markup.matchAll(/assets\/course-6\/([^')]+)/g)].map(match=>match[1]))];
  assert.equal(paths.length,78);
  for(const path of paths)assert.equal(existsSync(new URL(`../dist/assets/course-6/${path}`,import.meta.url)),true,path);
  assert.doesNotMatch(markup,/<svg|https?:\/\//);
});

test('V2 生产牌框只旋转插画并保持英文标题正向',()=>{
  const styles=readFileSync(new URL('../dist/styles.css',import.meta.url),'utf8');
  assert.match(styles,/\.orientation-reversed \.illustration\{rotate:0deg;transform:rotate\(180deg\)\}/);
  assert.match(styles,/\.orientation-reversed\.production-v2 \.face-caption\{rotate:0deg;transform:none\}/);
});

test('揭牌结果在每张牌上明确标出正逆位',()=>{
  const app=readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8');
  assert.match(app,/orientationLabel=orientation==='reversed'\?'↓ 逆位':'↑ 正位'/);
  assert.match(app,/result-card-position[^`]+\$\{orientationLabel\}/);
});
