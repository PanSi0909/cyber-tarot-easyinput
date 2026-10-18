import {cards} from './core.mjs';
import {pilotCardIds,renderPilotCardFace} from './card-visuals.mjs';

const cardById=new Map(cards.map(card=>[card.id,card]));
const gallery=document.querySelector('#pilot-gallery');
const reviewGallery=document.querySelector('#frame-review-gallery');
const batchReviewGallery=document.querySelector('#batch-review-gallery');
const batch02ReviewGallery=document.querySelector('#batch-02-review-gallery');
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
const batch02ReviewCandidates=[
  {id:'major-hierophant',type:'大阿卡纳 · 02A',note:'导师、两位成年学员与两把交叉钥匙；检查层级和留白。'},
  {id:'major-lovers',type:'大阿卡纳 · 02A',note:'两位成年人、双树与共同花束；检查人物关系和安全区。'},
  {id:'major-chariot',type:'大阿卡纳 · 02A',note:'战车、黑白双守护兽与远城；检查前后景层级。'},
  {id:'wands-ace',type:'数字小阿卡纳 · 02A',note:'严格一根发芽权杖；检查画面没有多余杆状物。'},
  {id:'wands-two',type:'数字小阿卡纳 · 02A',note:'严格两根固定权杖；检查石球不被误读为星币。'},
  {id:'wands-four',type:'数字小阿卡纳 · 02A',note:'严格四根竖直权杖组成庆典门廊，逐根清楚可数。'},
  {id:'cups-ace',type:'数字小阿卡纳 · 02A',note:'严格一只圣杯；检查水流和杯体在窄幅中完整。'},
  {id:'cups-three',type:'数字小阿卡纳 · 02A',note:'三位成年人举起严格三只圣杯；桌面不出现额外杯具。'},
  {id:'swords-page',type:'宫廷牌 · 02A',note:'信使与严格一把宝剑；检查人物动作和剑身完整。'},
  {id:'pentacles-page',type:'宫廷牌 · 02A',note:'学徒与严格一枚星币；背景工具不形成额外圆盘。'},
  {id:'major-strength',type:'大阿卡纳 · 02B',note:'成年人以照护姿态安抚一只狮子；检查关系表达与藤环。'},
  {id:'major-hermit',type:'大阿卡纳 · 02B',note:'一盏六芒星灯与一根普通手杖；检查雪山剪影和数量。'},
  {id:'major-wheel',type:'大阿卡纳 · 02B',note:'四季之轮与四角无字卷轴；检查画内不出现字母或数字。'},
  {id:'swords-ace',type:'数字小阿卡纳 · 02B',note:'严格一把竖直宝剑；月桂与橄榄枝不得形成额外武器。'},
  {id:'swords-two',type:'数字小阿卡纳 · 02B',note:'严格两把交叉宝剑；检查月湾背景中没有多余剑形。'},
  {id:'swords-four',type:'数字小阿卡纳 · 02B',note:'墙上三把、石台一把，共严格四把宝剑。'},
  {id:'pentacles-ace',type:'数字小阿卡纳 · 02B',note:'严格一枚星币；果园和花园中不出现额外圆盘。'},
  {id:'pentacles-two',type:'数字小阿卡纳 · 02B',note:'藤环连接严格两枚星币，背景保留两艘船。'},
  {id:'cups-page',type:'宫廷牌 · 02B',note:'信使、单一圣杯与跃出的小鱼；无其他容器。'},
  {id:'wands-knight',type:'宫廷牌 · 02B',note:'骑士、栗色马与严格一根发芽权杖；无长矛或额外杆件。'}
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
for(const candidate of batch02ReviewCandidates)appendReviewCard(batch02ReviewGallery,candidate);

for(const id of pilotCardIds){
  const card=cardById.get(id);
  const article=document.createElement('article');
  article.className='pilot-card';
  article.innerHTML=`<p>${card.id.startsWith('major-')?'大阿卡纳':'小阿卡纳'} · 样卡</p><div class="result-card">${renderPilotCardFace(card)}</div>`;
  gallery.append(article);
}
