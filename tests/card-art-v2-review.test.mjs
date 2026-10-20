import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

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

test('V2 全套 78 张已通过并启用本地生产映射',()=>{
  const manifest=JSON.parse(read('design/card-art-v2-manifest.json'));
  assert.equal(manifest.status,'production-ready');
  assert.equal(manifest.productionEnabled,true);
  assert.equal(manifest.productionAssetRoot,'dist/assets/course-6/cards-v2-web');
  assert.equal(manifest.pilotCards.length,8);
  assert.ok(manifest.pilotCards.every(card=>card.status==='approved'));
  assert.equal(manifest.batch01Cards.length,10);
  assert.ok(manifest.batch01Cards.every(card=>card.status==='approved'));
  assert.equal(manifest.batch02Cards.length,20);
  assert.ok(manifest.batch02Cards.every(card=>card.status==='approved'));
  assert.equal(manifest.batch03Cards.length,20);
  assert.ok(manifest.batch03Cards.every(card=>card.status==='approved'));
  assert.equal(manifest.batch04Cards.length,20);
  assert.ok(manifest.batch04Cards.every(card=>card.status==='approved'));
  assert.equal(manifest.summary.assets,78);
  assert.equal(manifest.summary.approved,78);
  assert.equal(manifest.summary.needsReview,0);
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

test('最后五张原始样卡已通过最终牌框正逆位复核',()=>{
  const manifest=JSON.parse(read('design/card-art-v2-manifest.json'));
  const page=read('dist/card-pilot.html'),script=read('dist/card-pilot.mjs');
  const finalFive=['major-death','cups-seven','swords-three','pentacles-ten','pentacles-queen'].map(id=>manifest.pilotCards.find(card=>card.id===id));
  assert.ok(finalFive.every(card=>card?.status==='approved'));
  assert.match(page,/全套牌面验收档案/);
  assert.match(page,/五张原始样卡 · 正逆位/);
  assert.match(script,/pilot-layout-review-gallery/);
  for(const card of finalFive){
    assert.match(script,new RegExp(`id:'${card.id}'`));
    assert.deepEqual(jpegDimensions(readBytes(card.sourceAsset)),{width:1024,height:1536});
  }
});

test('网页优化副本覆盖 78 张并保持 2:3 尺寸',()=>{
  const manifest=JSON.parse(read('design/card-art-v2-manifest.json'));
  const cards=[...manifest.pilotCards,...manifest.batch01Cards,...manifest.batch02Cards,...manifest.batch03Cards,...manifest.batch04Cards];
  for(const card of cards){
    const asset=`${manifest.productionAssetRoot}/${card.id}.jpg`;
    assert.deepEqual(jpegDimensions(readBytes(asset)),{width:640,height:960},card.id);
  }
});

test('第一批十张网页牌面均为 640 × 960 JPEG 并进入独立评审页',()=>{
  const manifest=JSON.parse(read('design/card-art-v2-manifest.json'));
  const page=read('dist/card-pilot.html'),script=read('dist/card-pilot.mjs');
  assert.match(page,/首批十张 · 正逆位/);
  for(const card of manifest.batch01Cards){
    assert.match(script,new RegExp(`id:'${card.id}'`));
    assert.deepEqual(jpegDimensions(readBytes(card.asset)),{width:640,height:960});
  }
});

test('第二批二十张网页牌面均为 640 × 960 JPEG 并已通过',()=>{
  const manifest=JSON.parse(read('design/card-art-v2-manifest.json'));
  const page=read('dist/card-pilot.html'),script=read('dist/card-pilot.mjs');
  assert.match(page,/第二批二十张 · 正逆位/);
  for(const card of manifest.batch02Cards){
    assert.match(script,new RegExp(`id:'${card.id}'`));
    assert.equal(card.status,'approved');
    assert.deepEqual(jpegDimensions(readBytes(card.asset)),{width:640,height:960});
  }
});

test('第三批二十张网页牌面均为 640 × 960 JPEG 并已通过',()=>{
  const manifest=JSON.parse(read('design/card-art-v2-manifest.json'));
  const page=read('dist/card-pilot.html'),script=read('dist/card-pilot.mjs');
  assert.match(page,/第三批二十张 · 正逆位/);
  for(const card of manifest.batch03Cards){
    assert.match(script,new RegExp(`id:'${card.id}'`));
    assert.equal(card.status,'approved');
    assert.deepEqual(jpegDimensions(readBytes(card.asset)),{width:640,height:960});
  }
});

test('第四批二十张网页牌面均为 640 × 960 JPEG 并已通过',()=>{
  const manifest=JSON.parse(read('design/card-art-v2-manifest.json'));
  const page=read('dist/card-pilot.html'),script=read('dist/card-pilot.mjs');
  assert.match(page,/第四批二十张 · 正逆位/);
  assert.match(page,/BATCH 04 \/ FINAL 20 · APPROVED/);
  for(const card of manifest.batch04Cards){
    assert.match(script,new RegExp(`id:'${card.id}'`));
    assert.equal(card.status,'approved');
    assert.deepEqual(jpegDimensions(readBytes(card.asset)),{width:640,height:960});
  }
});

test('正式发布树只保留八张旧牌框原始样卡',()=>{
  const manifest=JSON.parse(read('design/card-art-v2-manifest.json'));
  const originals=readdirSync(new URL('../dist/assets/course-6/cards/',import.meta.url)).filter(name=>name.endsWith('.jpg')).sort();
  const expected=manifest.pilotCards.map(card=>card.sourceAsset.split('/').at(-1)).sort();
  assert.deepEqual(originals,expected);
});
