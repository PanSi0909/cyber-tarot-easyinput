import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8');

test('V2 牌框复核仍与生产牌组隔离',()=>{
  const manifest=JSON.parse(read('design/card-art-v2-manifest.json'));
  assert.equal(manifest.status,'frame-review');
  assert.equal(manifest.productionEnabled,false);
  assert.equal(manifest.pilotCards.length,8);
  assert.ok(manifest.pilotCards.every(card=>card.status==='needs-layout-review'));
});

test('三类牌框只旋转插画并只保留英文牌名',()=>{
  const page=read('dist/card-pilot.html'),script=read('dist/card-pilot.mjs'),styles=read('dist/card-pilot.css');
  for(const id of ['major-fool','wands-three','cups-knight'])assert.match(script,new RegExp(`id:'${id}'`));
  assert.match(page,/三类样卡 · 正逆位并排/);
  assert.match(script,/class="v2-caption">\$\{card\.en\}/);
  assert.match(styles,/\.v2-card\.orientation-reversed \.v2-artwork\{transform:rotate\(180deg\)\}/);
  assert.doesNotMatch(script,/face-number|face-orientation/);
});
