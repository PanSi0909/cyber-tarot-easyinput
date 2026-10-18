import {cards} from './core.mjs';
import {pilotCardIds,renderPilotCardFace} from './card-visuals.mjs';

const cardById=new Map(cards.map(card=>[card.id,card]));
const gallery=document.querySelector('#pilot-gallery');
const pilotLayoutReviewGallery=document.querySelector('#pilot-layout-review-gallery');
const reviewGallery=document.querySelector('#frame-review-gallery');
const batchReviewGallery=document.querySelector('#batch-review-gallery');
const batch02ReviewGallery=document.querySelector('#batch-02-review-gallery');
const batch03ReviewGallery=document.querySelector('#batch-03-review-gallery');
const batch04ReviewGallery=document.querySelector('#batch-04-review-gallery');
const reviewCandidates=[
  {id:'major-fool',type:'大阿卡纳',note:'人物、白犬、悬崖与日出；检查主体安全区和逆位构图。'},
  {id:'wands-three',type:'数字小阿卡纳',note:'严格三根活木权杖；检查数量可读性与窄幅裁切。'},
  {id:'cups-knight',type:'宫廷牌',note:'骑士、白马与单一圣杯；检查人物层级和英文牌名。'}
];
const pilotLayoutReviewCandidates=[
  {id:'major-death',type:'原始样卡 · 大阿卡纳',note:'检查人物、白马、旗帜和远景是否都保留在最终牌框安全区。'},
  {id:'cups-seven',type:'原始样卡 · 数字小阿卡纳',note:'检查七只圣杯在正逆位中是否完整、可数且没有被裁切。'},
  {id:'swords-three',type:'原始样卡 · 数字小阿卡纳',note:'检查三把宝剑、心形主体与雨云在窄幅中的层级。'},
  {id:'pentacles-ten',type:'原始样卡 · 数字小阿卡纳',note:'检查十枚星币、人物与建筑在最终牌框中是否清楚可数。'},
  {id:'pentacles-queen',type:'原始样卡 · 宫廷牌',note:'检查王后、单一星币和自然背景的主体安全区。'}
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
const batch03ReviewCandidates=[
  {id:'major-justice',type:'大阿卡纳 · 03A',note:'一把竖直宝剑、一天秤与双柱；检查秩序感和安全区。'},
  {id:'major-hanged-man',type:'大阿卡纳 · 03A',note:'单脚踝安全悬挂、平静光环；检查姿态明确且无伤害表达。'},
  {id:'major-temperance',type:'大阿卡纳 · 03A',note:'严格两只杯与连续水流；检查一脚踏石、一脚触水。'},
  {id:'major-devil',type:'大阿卡纳 · 03A',note:'两位成年人、可自行取下的开放项圈与通向外界的道路。'},
  {id:'major-tower',type:'大阿卡纳 · 03A',note:'闪电、移位塔冠与双向撤离；检查突变感但无伤亡表现。'},
  {id:'major-star',type:'大阿卡纳 · 03A',note:'两只水罐、一颗大星和七颗小星；检查星群与双水流。'},
  {id:'major-moon',type:'大阿卡纳 · 03A',note:'双塔、家犬、野狼与池中甲壳生物；检查月相和路径层级。'},
  {id:'major-sun',type:'大阿卡纳 · 03A',note:'成年骑手、单一白马、无字织旗与向日葵庭院。'},
  {id:'major-judgement',type:'大阿卡纳 · 03A',note:'有翼信使、单一号角与走向光线的人群；挂旗保持无字。'},
  {id:'major-world',type:'大阿卡纳 · 03A',note:'月桂环、双织带与人鹰狮牛四角守望形象。'},
  {id:'wands-six',type:'数字小阿卡纳 · 03B',note:'领队一根、同行者五根，严格共六根权杖。'},
  {id:'wands-seven',type:'数字小阿卡纳 · 03B',note:'台上一根、坡下六根，严格共七根权杖。'},
  {id:'wands-eight',type:'数字小阿卡纳 · 03B',note:'严格八根平行飞越河谷的发芽权杖，全部分离可数。'},
  {id:'cups-four',type:'数字小阿卡纳 · 03B',note:'地面三只、云中递出一只，严格共四只圣杯。'},
  {id:'cups-five',type:'数字小阿卡纳 · 03B',note:'前方三只倾倒、后方两只直立，严格共五只圣杯。'},
  {id:'cups-six',type:'数字小阿卡纳 · 03B',note:'石阶两层严格摆放六只花杯，无其他容器。'},
  {id:'swords-five',type:'数字小阿卡纳 · 03B',note:'人物整理三把、沙地两把，严格共五把宝剑。'},
  {id:'swords-six',type:'数字小阿卡纳 · 03B',note:'船头严格固定六把宝剑，船桨保持宽阔木质。'},
  {id:'pentacles-three',type:'数字小阿卡纳 · 03B',note:'三位工匠与拱顶三枚星币；工具不带圆盘装饰。'},
  {id:'pentacles-four',type:'数字小阿卡纳 · 03B',note:'额前一枚、胸前一枚、双脚各一枚，严格共四枚星币。'}
];
const batch04ReviewCandidates=[
  {id:'wands-nine',type:'数字小阿卡纳 · 04',note:'手持一根、后方八根，严格共九根权杖。'},
  {id:'wands-ten',type:'数字小阿卡纳 · 04',note:'宽松束带中严格十根权杖，逐根分离可数。'},
  {id:'cups-eight',type:'数字小阿卡纳 · 04',note:'石台两排各四只，严格共八只圣杯。'},
  {id:'cups-nine',type:'数字小阿卡纳 · 04',note:'弧形石架单排严格九只圣杯。'},
  {id:'cups-ten',type:'数字小阿卡纳 · 04',note:'长桌左右各五只，严格共十只圣杯。'},
  {id:'swords-seven',type:'数字小阿卡纳 · 04',note:'怀中五把、地面两把，严格共七把宝剑。'},
  {id:'swords-nine',type:'数字小阿卡纳 · 04',note:'墙面三排三列，严格共九把宝剑。'},
  {id:'swords-ten',type:'数字小阿卡纳 · 04',note:'前后两排各五把，严格共十把宝剑；斗篷内无人。'},
  {id:'pentacles-five',type:'数字小阿卡纳 · 04',note:'工坊花窗严格五枚大型星币。'},
  {id:'pentacles-seven',type:'数字小阿卡纳 · 04',note:'藤架上严格七枚星币果实。'},
  {id:'pentacles-eight',type:'数字小阿卡纳 · 04',note:'墙上七枚、工作台一枚，严格共八枚星币。'},
  {id:'pentacles-nine',type:'数字小阿卡纳 · 04',note:'石格三排三列，严格共九枚星币。'},
  {id:'wands-queen',type:'宫廷牌 · 04',note:'向日葵庭院、黑猫与单一开花权杖。'},
  {id:'wands-king',type:'宫廷牌 · 04',note:'火山岩王座、蝾螈纹与单一发芽权杖。'},
  {id:'cups-queen',type:'宫廷牌 · 04',note:'潮汐石座与双手端持的单一带盖圣杯。'},
  {id:'cups-king',type:'宫廷牌 · 04',note:'海湾平台、单一圣杯与无尖端仪式短杖。'},
  {id:'swords-knight',type:'宫廷牌 · 04',note:'灰马、强风高原与双手控制的单一长剑。'},
  {id:'swords-queen',type:'宫廷牌 · 04',note:'临海峭壁、开放手势与单一竖直长剑。'},
  {id:'pentacles-knight',type:'宫廷牌 · 04',note:'深色农耕马、梯田与双手托起的单一星币。'},
  {id:'pentacles-king',type:'宫廷牌 · 04',note:'公牛纹石座、葡萄园与双手持有的单一星币。'}
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

for(const candidate of pilotLayoutReviewCandidates)appendReviewCard(pilotLayoutReviewGallery,candidate);
for(const candidate of reviewCandidates)appendReviewCard(reviewGallery,candidate);
for(const candidate of batchReviewCandidates)appendReviewCard(batchReviewGallery,candidate);
for(const candidate of batch02ReviewCandidates)appendReviewCard(batch02ReviewGallery,candidate);
for(const candidate of batch03ReviewCandidates)appendReviewCard(batch03ReviewGallery,candidate);
for(const candidate of batch04ReviewCandidates)appendReviewCard(batch04ReviewGallery,candidate);

for(const id of pilotCardIds){
  const card=cardById.get(id);
  const article=document.createElement('article');
  article.className='pilot-card';
  article.innerHTML=`<p>${card.id.startsWith('major-')?'大阿卡纳':'小阿卡纳'} · 样卡</p><div class="result-card">${renderPilotCardFace(card)}</div>`;
  gallery.append(article);
}
