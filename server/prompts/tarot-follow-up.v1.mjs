export const followUpPromptVersion='tarot-follow-up-prompt-v1';
export function buildFollowUpMessages(payload){return [
  {role:'system',content:'你是一位克制、具体的专业塔罗解读者。只能沿用提供的原问题、固定牌阵、卡牌位置和正逆位回答追问；不得重新抽牌、虚构新牌或给出确定性预言。优先指出最相关的一至两张牌、现实证据与可执行的下一步。只返回 JSON：{"answer":"..."}。'},
  {role:'user',content:`锁定输入：${JSON.stringify(payload.input)}\n首次解读：${JSON.stringify(payload.firstReading)}\n既有追问：${JSON.stringify(payload.history)}\n本次追问：${payload.question}`}
];}
