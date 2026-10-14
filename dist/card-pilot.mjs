import {cards} from './core.mjs';
import {pilotCardIds,renderPilotCardFace} from './card-visuals.mjs';

const cardById=new Map(cards.map(card=>[card.id,card]));
const gallery=document.querySelector('#pilot-gallery');

for(const id of pilotCardIds){
  const card=cardById.get(id);
  const article=document.createElement('article');
  article.className='pilot-card';
  article.innerHTML=`<p>${card.id.startsWith('major-')?'大阿卡纳':'小阿卡纳'} · 样卡</p><div class="result-card">${renderPilotCardFace(card)}</div>`;
  gallery.append(article);
}
