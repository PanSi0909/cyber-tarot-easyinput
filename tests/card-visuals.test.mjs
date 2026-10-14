import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {cards} from '../dist/core.mjs';
import {pilotCardIds,renderCardBack,renderCardFace,renderPilotCardFace} from '../dist/card-visuals.mjs';

test('牌背使用对称仪式纹样且不包含卡牌身份',()=>{
  const markup=renderCardBack();
  assert.match(markup,/card-back-art/);
  assert.match(markup,/back-eclipse/);
  for(const card of cards)assert.doesNotMatch(markup,new RegExp(card.name));
});

test('78 张牌都有完整牌面结构与方向标识',()=>{
  assert.equal(cards.length,78);
  for(const card of cards){
    const upright=renderCardFace(card,'upright'),reversed=renderCardFace(card,'reversed');
    assert.match(upright,/card-face-visual/);
    assert.match(upright,new RegExp(card.name));
    assert.match(upright,new RegExp(card.keywords));
    assert.match(upright,/↑ 正位/);
    assert.match(reversed,/↓ 逆位/);
    assert.notEqual(upright,reversed);
  }
});

test('22 张大牌逐张使用独立场景，56 张小牌使用花色和位阶规则',()=>{
  const majors=cards.filter(card=>card.id.startsWith('major-'));
  const minors=cards.filter(card=>!card.id.startsWith('major-'));
  assert.equal(majors.length,22);
  assert.equal(minors.length,56);
  const majorArtwork=majors.map(card=>{
    const match=renderCardFace(card).match(/--art:url\('([^']+)'\)(?:;--art-position:([^";]+))?/);
    return match&&`${match[1]}#${match[2]??'full'}`;
  });
  for(const card of majors)assert.match(renderCardFace(card),/major-illustration/);
  assert.equal(new Set(majorArtwork).size,22);
  for(const card of minors)assert.match(renderCardFace(card),/minor-illustration/);
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

test('数字小阿卡纳以正确数量的对应花色元素呈现',()=>{
  const expected={ace:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
  for(const card of cards.filter(item=>!item.id.startsWith('major-'))){
    const [suit,rank]=card.id.split('-');
    if(!(rank in expected))continue;
    const markup=renderCardFace(card);
    assert.match(markup,new RegExp(`data-pip-count="${expected[rank]}"`),card.id);
    assert.equal((markup.match(new RegExp(`symbol-${suit}`, 'g'))||[]).length,expected[rank],card.id);
  }
});

test('宫廷牌显示与所属花色一致的独立标识',()=>{
  for(const card of cards.filter(item=>/-page|-knight|-queen|-king/.test(item.id))){
    const [suit]=card.id.split('-');
    const markup=renderCardFace(card,'reversed');
    assert.match(markup,new RegExp(`court-emblem symbol-${suit}`),card.id);
    assert.doesNotMatch(markup,/court-seal[^>]*>[^<]*<b[^>]*>[^<]+<\/b>/,card.id);
  }
});

test('生产牌面只引用项目内原创资产且文件完整',()=>{
  const markup=cards.map(card=>renderCardFace(card)).join('');
  const paths=[...new Set([...markup.matchAll(/assets\/course-6\/([^')]+)/g)].map(match=>match[1]))];
  assert.equal(paths.length,9);
  for(const path of paths)assert.equal(existsSync(new URL(`../dist/assets/course-6/${path}`,import.meta.url)),true,path);
  assert.doesNotMatch(markup,/<svg|https?:\/\//);
});
