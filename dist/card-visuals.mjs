const majorOrder=['fool','magician','high-priestess','empress','emperor','hierophant','lovers','chariot','strength','hermit','wheel','justice','hanged-man','death','temperance','devil','tower','star','moon','sun','judgement','world'];
const suitMeta={
  wands:{label:'WANDS · 权杖',sheet:'major-21-wands-cups.jpg',position:'center'},
  cups:{label:'CUPS · 圣杯',sheet:'major-21-wands-cups.jpg',position:'right'},
  swords:{label:'SWORDS · 宝剑',sheet:'swords-pentacles-court.jpg',position:'left'},
  pentacles:{label:'PENTACLES · 星币',sheet:'swords-pentacles-court.jpg',position:'center'}
};
const rankNumbers={ace:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
const courtLabels={page:'PAGE',knight:'KNIGHT',queen:'QUEEN',king:'KING'};
const pilotArtwork={
  'major-fool':'major-fool.jpg',
  'major-death':'major-death.jpg',
  'wands-three':'wands-three.jpg',
  'cups-seven':'cups-seven.jpg',
  'swords-three':'swords-three.jpg',
  'pentacles-ten':'pentacles-ten.jpg',
  'cups-knight':'cups-knight.jpg',
  'pentacles-queen':'pentacles-queen.jpg'
};

export const pilotCardIds=Object.freeze(Object.keys(pilotArtwork));

function escapeHtml(value){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}

function majorArtwork(id){
  const key=id.replace('major-',''),index=majorOrder.indexOf(key);
  if(index===21)return {sheet:'major-21-wands-cups.jpg',position:'left'};
  const start=Math.floor(index/3)*3,end=start+2,number=value=>String(value).padStart(2,'0');
  return {sheet:`major-${number(start)}-${number(end)}.jpg`,position:['left','center','right'][index%3]};
}

function pipField(suit,rank){
  const count=rankNumbers[rank]||1;
  return `<span class="pip-constellation pips-${count}" data-pip-count="${count}">${Array.from({length:count},()=>`<i class="suit-symbol symbol-${suit}"></i>`).join('')}</span>`;
}

function artworkFor(card,usePilotArtwork=false){
  const pilot=usePilotArtwork&&pilotArtwork[card.id];
  if(pilot){
    const [,rank]=card.id.split('-'),count=rankNumbers[rank];
    const countAttribute=count?` data-pip-count="${count}"`:'';
    const familyClass=card.id.startsWith('major-')?'major-illustration':'minor-illustration';
    return `<span class="illustration ${familyClass} bespoke-illustration"${countAttribute} style="--art:url('./assets/course-6/cards/${pilot}')"></span>`;
  }
  if(card.id.startsWith('major-')){
    const art=majorArtwork(card.id);
    return `<span class="illustration major-illustration" style="--art:url('./assets/course-6/${art.sheet}');--art-position:${art.position}"></span>`;
  }
  const [suit,rank]=card.id.split('-'),meta=suitMeta[suit];
  const illustration=`<span class="illustration minor-illustration${courtLabels[rank]?' court-illustration':''}" style="--art:url('./assets/course-6/${courtLabels[rank]?'swords-pentacles-court.jpg':meta.sheet}');--art-position:${courtLabels[rank]?'right':meta.position}"></span>`;
  if(courtLabels[rank])return `${illustration}<span class="court-seal">${escapeHtml(courtLabels[rank])}<b class="court-emblem symbol-${suit}"></b><small>${escapeHtml(meta.label)}</small></span>`;
  return `${illustration}${pipField(suit,rank)}<span class="suit-caption">${escapeHtml(meta.label)}</span>`;
}

export function renderCardBack(){
  return '<span class="card-back-art" aria-hidden="true"><span class="back-frame"></span><span class="back-flora flora-a">✤</span><span class="back-flora flora-b">✤</span><span class="back-orbit orbit-a"></span><span class="back-orbit orbit-b"></span><span class="back-eclipse"></span><span class="back-star star-a">✦</span><span class="back-star star-b">✦</span><span class="back-monogram">BETWEEN<br>SIGNALS</span></span><span class="candidate-label">CURRENT · 当前候选</span>';
}

function renderFace(card,orientation,usePilotArtwork){
  const family=card.id.startsWith('major-')?'major':card.id.split('-')[0];
  return `<span class="card-face-visual family-${escapeHtml(family)} orientation-${orientation}" aria-hidden="true"><span class="face-number">${escapeHtml(card.number)}</span><span class="face-orientation">${orientation==='reversed'?'↓ 逆位':'↑ 正位'}</span><span class="face-artwork">${artworkFor(card,usePilotArtwork)}</span><span class="face-caption"><strong>${escapeHtml(card.name)}</strong><small>${escapeHtml(card.en)}</small><em>${escapeHtml(card.keywords)}</em></span></span>`;
}

export function renderCardFace(card,orientation='upright'){
  return renderFace(card,orientation,false);
}

export function renderPilotCardFace(card,orientation='upright'){
  return renderFace(card,orientation,true);
}
