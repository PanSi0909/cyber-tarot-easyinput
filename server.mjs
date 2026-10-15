import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolveProviderConfig,publicProviderConfig} from './server/config.mjs';
import {generateInitial,generateFollowUp,generateInsight} from './server/providers.mjs';

const root=path.dirname(fileURLToPath(import.meta.url)),distRoot=path.join(root,'dist'),maxBodyBytes=64*1024;
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
function sendJson(response,status,value){response.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});response.end(JSON.stringify(value));}
async function readJson(request){let size=0,body='';for await(const chunk of request){size+=chunk.length;if(size>maxBodyBytes)throw new Error('请求内容超过 64KB。');body+=chunk;}try{return JSON.parse(body);}catch{throw new Error('请求必须是有效 JSON。');}}
async function serveStatic(request,response,pathname){
  const relative=pathname==='/'?'index.html':decodeURIComponent(pathname).replace(/^\/+/,''),target=path.resolve(distRoot,relative);
  if(target!==distRoot&&!target.startsWith(`${distRoot}${path.sep}`)){response.writeHead(403);response.end('Forbidden');return;}
  try{const content=await readFile(target);response.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream','cache-control':'no-cache'});if(request.method==='HEAD')response.end();else response.end(content);}catch{response.writeHead(404);response.end('Not found');}
}

export function createTarotServer(env=process.env){
  const config=resolveProviderConfig(env);
  return http.createServer(async(request,response)=>{
    const url=new URL(request.url,'http://127.0.0.1');
    try{
      if(request.method==='GET'&&url.pathname==='/api/config')return sendJson(response,200,publicProviderConfig(config));
      if(request.method==='POST'&&url.pathname==='/api/readings'){
        const body=await readJson(request);
        if(body.type==='initial')return sendJson(response,200,{result:await generateInitial(config,body.input)});
        if(body.type==='follow-up')return sendJson(response,200,{result:await generateFollowUp(config,{input:body.input,firstReading:body.firstReading,history:body.history,question:body.question})});
        return sendJson(response,400,{error:'type 只支持 initial 或 follow-up。'});
      }
      if(request.method==='POST'&&url.pathname==='/api/insights'){
        const body=await readJson(request);
        return sendJson(response,200,{result:await generateInsight(config,body.summary)});
      }
      if(!['GET','HEAD'].includes(request.method))return sendJson(response,405,{error:'不支持的请求方法。'});
      await serveStatic(request,response,url.pathname);
    }catch(error){sendJson(response,400,{error:error?.message||'请求处理失败。'});}
  });
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||4173),server=createTarotServer();
  server.listen(port,host,()=>console.log(`Cyber Tarot local server: http://${host}:${port}/`));
}
