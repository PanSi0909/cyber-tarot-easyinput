const allowedProviders=new Set(['mock','bailian']);

export function resolveProviderConfig(env=process.env){
  const provider=(env.TAROT_AI_PROVIDER||'mock').trim().toLowerCase();
  if(!allowedProviders.has(provider))throw new Error('TAROT_AI_PROVIDER 只支持 mock 或 bailian。');
  if(provider==='mock')return {provider,model:null,baseUrl:null,apiKey:null};
  const apiKey=env.DASHSCOPE_API_KEY?.trim(),baseUrl=env.DASHSCOPE_BASE_URL?.trim(),model=(env.DASHSCOPE_MODEL||'qwen3.7-flash').trim();
  if(!apiKey||!baseUrl)throw new Error('启用 bailian 前必须在服务端配置 DASHSCOPE_API_KEY 与 DASHSCOPE_BASE_URL。');
  return {provider,model,baseUrl:baseUrl.replace(/\/$/,''),apiKey};
}

export function publicProviderConfig(config){return {provider:config.provider,model:config.model,label:config.provider==='mock'?'本地专业知识模拟接口':'百炼安全服务端接口'};}
