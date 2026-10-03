import {mockReadingProvider,normalizeReading} from '../dist/ai-reading.mjs';
import {assertReadingInput,assertFollowUpPayload} from './reading-schema.mjs';
import {buildInitialMessages} from './prompts/tarot-reading.v1.mjs';
import {buildFollowUpMessages} from './prompts/tarot-follow-up.v1.mjs';

function parseJsonContent(value){
  const text=typeof value==='string'?value.trim():'';
  if(!text)throw new Error('模型没有返回内容。');
  const unfenced=text.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  try{return JSON.parse(unfenced);}catch{throw new Error('模型返回的 JSON 无法解析。');}
}

async function callBailian(config,messages,fetchImpl=fetch){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{
    const response=await fetchImpl(`${config.baseUrl}/chat/completions`,{method:'POST',signal:controller.signal,headers:{authorization:`Bearer ${config.apiKey}`,'content-type':'application/json'},body:JSON.stringify({model:config.model,messages,temperature:0.75,response_format:{type:'json_object'}})});
    const body=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(`模型服务请求失败（${response.status}）。`);
    return parseJsonContent(body.choices?.[0]?.message?.content);
  }catch(error){if(error?.name==='AbortError')throw new Error('模型服务响应超时。');throw error;}finally{clearTimeout(timer);}
}

export async function generateInitial(config,input,fetchImpl=fetch){
  assertReadingInput(input);
  if(config.provider==='mock')return mockReadingProvider.generateReading(input);
  return normalizeReading(await callBailian(config,buildInitialMessages(input),fetchImpl),input);
}

export async function generateFollowUp(config,payload,fetchImpl=fetch){
  assertFollowUpPayload(payload);
  if(config.provider==='mock')return mockReadingProvider.answerFollowUp(payload);
  const result=await callBailian(config,buildFollowUpMessages(payload),fetchImpl),answer=typeof result?.answer==='string'?result.answer.trim():'';
  if(!answer)throw new Error('模型返回的追问答案无效。');return answer;
}
