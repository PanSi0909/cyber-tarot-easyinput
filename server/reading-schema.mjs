export const readingJsonSchema={
  type:'object',additionalProperties:false,
  required:['title','overview','cardReadings','synthesis','guidance','voiceSummary'],
  properties:{
    title:{type:'string'},overview:{type:'string'},
    cardReadings:{type:'array',items:{type:'object',additionalProperties:false,required:['position','card','orientation','interpretation'],properties:{position:{type:'string'},card:{type:'string'},orientation:{type:'string',enum:['upright','reversed']},interpretation:{type:'string'}}}},
    synthesis:{type:'string'},guidance:{type:'array',minItems:1,maxItems:5,items:{type:'string'}},voiceSummary:{type:'string',maxLength:220}
  }
};

export function assertReadingInput(input){
  if(!input||input.schemaVersion!=='tarot-reading-v1'||typeof input.question!=='string'||!input.question.trim()||input.question.length>280)throw new Error('解读输入的问题无效。');
  if(!input.spread||typeof input.spread.id!=='string'||!Number.isInteger(input.spread.count)||!Array.isArray(input.cards)||input.cards.length!==input.spread.count)throw new Error('解读输入的牌阵无效。');
  for(const card of input.cards)if(!card||typeof card.id!=='string'||typeof card.position!=='string'||!['upright','reversed'].includes(card.orientation)||!card.knowledge)throw new Error('解读输入的卡牌资料无效。');
  return input;
}

export function assertFollowUpPayload(payload){
  assertReadingInput(payload.input);
  if(!payload.firstReading||!Array.isArray(payload.history)||typeof payload.question!=='string'||!payload.question.trim()||payload.question.length>280)throw new Error('追问输入无效。');
  return payload;
}
