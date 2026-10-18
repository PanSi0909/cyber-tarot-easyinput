import {cards} from './core.mjs';
import {pilotCardIds,renderPilotCardFace} from './card-visuals.mjs';

const cardById=new Map(cards.map(card=>[card.id,card]));
const gallery=document.querySelector('#pilot-gallery');
const reviewGallery=document.querySelector('#frame-review-gallery');
const batchReviewGallery=document.querySelector('#batch-review-gallery');
const reviewCandidates=[
  {id:'major-fool',type:'大阿卡纳',note:'人物、白犬、悬崖与日出；检查主体安全区和逆位构图。'},
  {id:'wands-three',type:'数字小阿卡纳',note:'严格三根活木权杖；检查数量可读性与窄幅裁切。'},
  {id:'cups-knight',type:'宫廷牌',note:'骑士、白马与单一圣杯；检查人物层级和英文牌名。'}
];
const batchReviewCandidates=[
  {id:'major-magician',type:'大阿卡纳',note:'四件器物、举杖与指地动作；检查象征物完整性。'},
  {id:'major-high-priestess',type:'大阿卡纳',note:'深浅双柱、无字卷轴、新月与石榴帘幕。'},
  {id:'major-empress',type:'大阿卡纳',note:'星冠、麦穗权杖、心形植物盾牌与丰盛景观。'},
  {id:'major-emperor',type:'大阿卡纳',note:'公羊王座、权杖、无字石球与山地秩序。'},
  {id:'wands-five',type:'数字小阿卡纳',note:'严格五根活木权杖；检查交错后仍可逐根辨认。'},
  {id:'cups-two',type:'数字小阿卡纳',note:'严格两只圣杯；检查人物与杯体都在安全区内。'},
  {id:'swords-eight',type:'数字小阿卡纳',note:'严格八把宝剑；检查剑尖、剑柄与出口清楚。'},
  {id:'pentacles-six',type:'数字小阿卡纳',note:'严格六枚建筑星币；检查完整、可数且不悬浮。'},
  {id:'wands-page',type:'宫廷牌',note:'单一发芽权杖、信使与绿洲荒漠对照。'},
  {id:'swords-king',type:'宫廷牌',note:'单一长剑、风云蝶纹王座与清晰正面层级。'}
];

function v2Frame(card,orientation){
  const label=orientation==='reversed'?'逆位':'正位';
  return `<figure class="frame-state"><div class="v2-card orientation-${orientation}"><div class="v2-art-window"><img class="v2-artwork" src="./assets/course-6/cards/${card.id}.jpg" alt=""></div><div class="v2-caption">${card.en}</div></div><figcaption>${label} · ${orientation.toUpperCase()}</figcaption></figure>`;
}

function appendReviewCard(target,candidate){
  const card=cardById.get(candidate.id);
  const article=document.createElement('article');
  article.className='frame-review-card';
  article.innerHTML=`<header><p>${candidate.type} · FRAME CANDIDATE</p><h3>${card.name}</h3><span>${candidate.note}</span></header><div class="frame-pair">${v2Frame(card,'upright')}${v2Frame(card,'reversed')}</div>`;
  target.append(article);
}

for(const candidate of reviewCandidates)appendReviewCard(reviewGallery,candidate);
for(const candidate of batchReviewCandidates)appendReviewCard(batchReviewGallery,candidate);

for(const id of pilotCardIds){
  const card=cardById.get(id);
  const article=document.createElement('article');
  article.className='pilot-card';
  article.innerHTML=`<p>${card.id.startsWith('major-')?'大阿卡纳':'小阿卡纳'} · 样卡</p><div class="result-card">${renderPilotCardFace(card)}</div>`;
  gallery.append(article);
}
