import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
const readBytes=name=>readFileSync(new URL(`../${name}`,import.meta.url));
const jpegDimensions=data=>{
  assert.equal(data[0],0xff);
  assert.equal(data[1],0xd8);
  for(let offset=2;offset<data.length-9;){
    if(data[offset]!==0xff){offset++;continue;}
    const marker=data[offset+1];
    if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return {height:data.readUInt16BE(offset+5),width:data.readUInt16BE(offset+7)};
    if(marker===0xd9||marker===0xda)break;
    if(marker===0xd8||marker===0x01){offset+=2;continue;}
    const length=data.readUInt16BE(offset+2);
    assert.ok(length>=2);
    offset+=2+length;
  }
  assert.fail('JPEG 缺少尺寸信息');
};

test('V2 牌框复核仍与生产牌组隔离',()=>{
  const manifest=JSON.parse(read('design/card-art-v2-manifest.json'));
  assert.equal(manifest.status,'pilot-layout-review');
  assert.equal(manifest.productionEnabled,false);
  assert.equal(manifest.pilotCards.length,8);
  assert.deepEqual(manifest.pilotCards.filter(card=>card.status==='approved').map(card=>card.id),['major-fool','wands-three','cups-knight']);
  assert.equal(manifest.pilotCards.filter(card=>card.status==='needs-layout-review').length,5);
  assert.equal(manifest.batch01Cards.length,10);
  assert.ok(manifest.batch01Cards.every(card=>card.status==='approved'));
  assert.equal(manifest.batch02Cards.length,20);
  assert.ok(manifest.batch02Cards.every(card=>card.status==='approved'));
  assert.equal(manifest.batch03Cards.length,20);
  assert.ok(manifest.batch03Cards.every(card=>card.status==='approved'));
  assert.equal(manifest.batch04Cards.length,20);
  assert.ok(manifest.batch04Cards.every(card=>card.status==='approved'));
  assert.equal(manifest.summary.assets,78);
  assert.equal(manifest.summary.approved,73);
  assert.equal(manifest.summary.needsReview,5);
  assert.equal(manifest.summary.pending,0);
});

test('三类牌框只旋转插画并只保留英文牌名',()=>{
  const page=read('dist/card-pilot.html'),script=read('dist/card-pilot.mjs'),styles=read('dist/card-pilot.css');
  for(const id of ['major-fool','wands-three','cups-knight'])assert.match(script,new RegExp(`id:'${id}'`));
  assert.match(page,/三类样卡 · 正逆位并排/);
  assert.match(script,/class="v2-caption">\$\{card\.en\}/);
  assert.match(styles,/\.v2-card\.orientation-reversed \.v2-artwork\{transform:rotate\(180deg\)\}/);
  assert.doesNotMatch(script,/face-number|face-orientation/);
});

test('最后五张原始样卡以最终牌框正逆位并排进入版式复核',()=>{
  const manifest=JSON.parse(read('design/card-art-v2-manifest.json'));
  const page=read('dist/card-pilot.html'),script=read('dist/card-pilot.mjs');
  const pending=manifest.pilotCards.filter(card=>card.status==='needs-layout-review');
  assert.equal(pending.length,5);
  assert.match(page,/最后五张原始样卡复核/);
  assert.match(page,/五张原始样卡 · 正逆位/);
  assert.match(page,/5 张样卡待版式复核/);
  assert.match(script,/pilot-layout-review-gallery/);
  for(const card of pending){
    assert.match(script,new RegExp(`id:'${card.id}'`));
    assert.deepEqual(jpegDimensions(readBytes(card.asset)),{width:1024,height:1536});
  }
});

test('第一批十张牌均为 1024 × 1536 JPEG 并进入独立评审页',()=>{
  const manifest=JSON.parse(read('design/card-art-v2-manifest.json'));
  const page=read('dist/card-pilot.html'),script=read('dist/card-pilot.mjs');
  assert.match(page,/首批十张 · 正逆位/);
  for(const card of manifest.batch01Cards){
    assert.match(script,new RegExp(`id:'${card.id}'`));
    assert.deepEqual(jpegDimensions(readBytes(card.asset)),{width:1024,height:1536});
  }
});

test('第二批二十张牌均为 1024 × 1536 JPEG 并已通过',()=>{
  const manifest=JSON.parse(read('design/card-art-v2-manifest.json'));
  const page=read('dist/card-pilot.html'),script=read('dist/card-pilot.mjs');
  assert.match(page,/第二批二十张 · 正逆位/);
  for(const card of manifest.batch02Cards){
    assert.match(script,new RegExp(`id:'${card.id}'`));
    assert.equal(card.status,'approved');
    assert.deepEqual(jpegDimensions(readBytes(card.asset)),{width:1024,height:1536});
  }
});

test('第三批二十张牌均为 1024 × 1536 JPEG 并已通过',()=>{
  const manifest=JSON.parse(read('design/card-art-v2-manifest.json'));
  const page=read('dist/card-pilot.html'),script=read('dist/card-pilot.mjs');
  assert.match(page,/第三批二十张 · 正逆位/);
  for(const card of manifest.batch03Cards){
    assert.match(script,new RegExp(`id:'${card.id}'`));
    assert.equal(card.status,'approved');
    assert.deepEqual(jpegDimensions(readBytes(card.asset)),{width:1024,height:1536});
  }
});

test('第四批二十张牌均为 1024 × 1536 JPEG 并已通过',()=>{
  const manifest=JSON.parse(read('design/card-art-v2-manifest.json'));
  const page=read('dist/card-pilot.html'),script=read('dist/card-pilot.mjs');
  assert.match(page,/第四批二十张 · 正逆位/);
  assert.match(page,/BATCH 04 \/ FINAL 20 · APPROVED/);
  for(const card of manifest.batch04Cards){
    assert.match(script,new RegExp(`id:'${card.id}'`));
    assert.equal(card.status,'approved');
    assert.deepEqual(jpegDimensions(readBytes(card.asset)),{width:1024,height:1536});
  }
});
