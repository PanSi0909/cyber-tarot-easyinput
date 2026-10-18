import {cards} from './core.mjs';
import {pilotCardIds,renderPilotCardFace} from './card-visuals.mjs';

const cardById=new Map(cards.map(card=>[card.id,card]));
const gallery=document.querySelector('#pilot-gallery');
const reviewGallery=document.querySelector('#frame-review-gallery');
const reviewCandidates=[
  {id:'major-fool',type:'大阿卡纳',note:'人物、白犬、悬崖与日出；检查主体安全区和逆位构图。'},
  {id:'wands-three',type:'数字小阿卡纳',note:'严格三根活木权杖；检查数量可读性与窄幅裁切。'},
  {id:'cups-knight',type:'宫廷牌',note:'骑士、白马与单一圣杯；检查人物层级和英文牌名。'}
];

function v2Frame(card,orientation){
  const label=orientation==='reversed'?'逆位':'正位';
  return `<figure class="frame-state"><div class="v2-card orientation-${orientation}"><div class="v2-art-window"><img class="v2-artwork" src="./assets/course-6/cards/${card.id}.jpg" alt=""></div><div class="v2-caption">${card.en}</div></div><figcaption>${label} · ${orientation.toUpperCase()}</figcaption></figure>`;
}

for(const candidate of reviewCandidates){
  const card=cardById.get(candidate.id);
  const article=document.createElement('article');
  article.className='frame-review-card';
  article.innerHTML=`<header><p>${candidate.type} · FRAME CANDIDATE</p><h3>${card.name}</h3><span>${candidate.note}</span></header><div class="frame-pair">${v2Frame(card,'upright')}${v2Frame(card,'reversed')}</div>`;
  reviewGallery.append(article);
}

for(const id of pilotCardIds){
  const card=cardById.get(id);
  const article=document.createElement('article');
  article.className='pilot-card';
  article.innerHTML=`<p>${card.id.startsWith('major-')?'大阿卡纳':'小阿卡纳'} · 样卡</p><div class="result-card">${renderPilotCardFace(card)}</div>`;
  gallery.append(article);
}
