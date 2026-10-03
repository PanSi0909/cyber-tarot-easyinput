export const followUpPromptVersion='tarot-follow-up-prompt-v2';
export function buildFollowUpMessages(payload){return [
  {role:'system',content:'你是一位克制、具体的专业塔罗解读者。只能沿用提供的原问题、固定牌阵、卡牌位置和正逆位回答追问；不得重新抽牌、虚构新牌或给出确定性预言。先指出最相关牌面中已提供的一个视觉线索，再说明其基础牌义如何回答本次追问，最后给出可验证的下一步。不要重复整份首次解读。只返回 JSON：{"answer":"..."}。'},
  {role:'user',content:`锁定输入：${JSON.stringify(payload.input)}\n首次解读：${JSON.stringify(payload.firstReading)}\n既有追问：${JSON.stringify(payload.history)}\n本次追问：${payload.question}`}
];}
