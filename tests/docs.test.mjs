import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const courseDir=path.join(repoRoot,'docs','course-notes');
const courseFiles=[
  '03-voice-interaction.md',
  '04-ai-reading.md',
  '05-history-workflow.md',
  '06-design-learning.md',
  '07-period-insights.md',
  '08-final-integration.md'
];
const requiredSections=[
  '## 课程目标',
  '## 当时基线',
  '## 范围与禁止事项',
  '## 实现思路',
  '## 关键转折与踩坑',
  '## 人与 AI 如何分工',
  '## 验收证据',
  '## 读者练习',
  '## 当前版本中的变化',
  '## 相关提交与资料'
];

const markdownFiles=directory=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
  const fullPath=path.join(directory,entry.name);
  if(entry.isDirectory())return markdownFiles(fullPath);
  return entry.isFile()&&entry.name.endsWith('.md')?[fullPath]:[];
});

test('第 3–8 课实践章结构完整并声明对话编辑边界',()=>{
  for(const [index,file] of courseFiles.entries()){
    const fullPath=path.join(courseDir,file);
    assert.equal(fs.existsSync(fullPath),true,`missing ${file}`);
    const source=fs.readFileSync(fullPath,'utf8');
    assert.match(source,new RegExp(`^# 第 ${index+3} 课实践：`,'m'));
    for(const section of requiredSections)assert.match(source,new RegExp(`^${section}$`,'m'),`${file} missing ${section}`);
    assert.match(source,/<summary>关键对话摘录<\/summary>/);
    assert.match(source,/为清晰和隐私经过编辑，不是逐字聊天记录/);
  }
});

test('新手文档中的仓库内相对链接均指向现有目标',()=>{
  const files=[path.join(repoRoot,'README.md'),...markdownFiles(path.join(repoRoot,'docs'))];
  const broken=[];
  for(const file of files){
    const source=fs.readFileSync(file,'utf8');
    for(const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){
      const rawTarget=match[1].trim();
      if(!rawTarget||rawTarget.startsWith('#')||/^(?:https?:|mailto:)/.test(rawTarget))continue;
      const withoutAnchor=rawTarget.split('#')[0].split('?')[0];
      if(!withoutAnchor)continue;
      const resolved=path.resolve(path.dirname(file),decodeURIComponent(withoutAnchor));
      if(!fs.existsSync(resolved))broken.push(`${path.relative(repoRoot,file)} -> ${rawTarget}`);
    }
  }
  assert.deepEqual(broken,[]);
});

test('公开学习文档不包含私人路径、会话标识或凭据',()=>{
  const files=[path.join(repoRoot,'README.md'),...markdownFiles(path.join(repoRoot,'docs'))];
  const forbidden=[
    /\/Users\//,
    /thread:\/\//,
    /my\.feishu\.cn/i,
    /accounts\.feishu\.cn/i,
    /(?:flow_id|user_code)=/i,
    /appg(?:dep|prj|ver)_/i,
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
    /\bsk-[A-Za-z0-9_-]{20,}\b/,
    /DASHSCOPE_API_KEY\s*=\s*[^\s$<{]+/
  ];
  const findings=[];
  for(const file of files){
    const source=fs.readFileSync(file,'utf8');
    for(const pattern of forbidden)if(pattern.test(source))findings.push(`${path.relative(repoRoot,file)} matched ${pattern}`);
  }
  assert.deepEqual(findings,[]);
});
