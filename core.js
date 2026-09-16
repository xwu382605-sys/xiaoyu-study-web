export const SUBJECTS=['政治','英语','艺术概论'];
export const TYPES={single:'单选题',multiple:'多选题',boolean:'判断题',fill:'填空题',short:'简答题',essay:'论述题',definition:'名词解释',appreciation:'作品赏析'};
export const initialState=()=>({schema:1,attempts:[],wrong:{},custom:[],hidden:[],session:null});
export const normalize=s=>String(s??'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
export function grade(q,answer){
 if(Array.isArray(answer)?!answer.length:!String(answer??'').trim())return false;
 if(['single','multiple','boolean'].includes(q.type))return [...(Array.isArray(answer)?answer:[answer])].sort().join('|')===[...q.answer].sort().join('|');
 if(q.type==='fill')return q.answer.some(a=>normalize(a)===normalize(answer));return null;
}
export function summarize(bank,state,subject){
 const questions=bank.filter(q=>!subject||q.subject===subject),ids=new Set(questions.map(q=>q.id)),attempts=state.attempts.filter(a=>ids.has(a.questionId)),scored=attempts.filter(a=>typeof a.correct==='boolean');
 return {total:questions.length,done:new Set(attempts.map(a=>a.questionId)).size,attempts:attempts.length,correct:scored.filter(a=>a.correct).length,scored:scored.length,wrong:Object.keys(state.wrong).filter(id=>ids.has(id)).length};
}
export function validateQuestions(input){
 const rows=Array.isArray(input)?input:input?.questions;if(!Array.isArray(rows)||!rows.length||rows.length>20000)throw Error('题库必须包含 1–20000 道题。');
 const ids=new Set();return rows.map((q,i)=>{
  if(!q||typeof q!=='object'||!SUBJECTS.includes(q.subject)||!TYPES[q.type])throw Error(`第 ${i+1} 题的科目或题型不正确。`);
  if(typeof q.id!=='string'||!/^[-\w]{1,100}$/.test(q.id)||ids.has(q.id)||q.id in Object.prototype)throw Error(`第 ${i+1} 题的编号为空、不规范或重复。`);ids.add(q.id);
  if(typeof q.stem!=='string'||!q.stem.trim()||q.stem.length>20000)throw Error(`第 ${i+1} 题的题干不正确。`);
  if(!Array.isArray(q.answer)||!q.answer.length||q.answer.some(a=>typeof a!=='string'||!a.trim()||a.length>30000))throw Error(`第 ${i+1} 题缺少有效答案。`);
  let options=[];if(['single','multiple','boolean'].includes(q.type)){
   if(!Array.isArray(q.options)||q.options.length<2||q.options.length>10||q.options.some(a=>typeof a!=='string'||!a.trim()))throw Error(`第 ${i+1} 题缺少选项。`);
   options=q.options;if(q.answer.some(a=>!Number.isInteger(Number(a))||String(Number(a))!==a||Number(a)<0||Number(a)>=options.length)||new Set(q.answer).size!==q.answer.length)throw Error(`第 ${i+1} 题的答案未对应选项。`);
   if(q.type!=='multiple'&&q.answer.length!==1)throw Error(`第 ${i+1} 题只能有一个答案。`);
  }
  for(const key of ['explanation','source','context','group'])if(q[key]!=null&&(typeof q[key]!=='string'||q[key].length>40000))throw Error(`第 ${i+1} 题的 ${key} 不正确。`);
  return {id:q.id,subject:q.subject,type:q.type,stem:q.stem.trim(),options,answer:q.answer,explanation:q.explanation||'',source:q.source||'自行导入',context:q.context||'',group:q.group||'自建题库',number:String(q.number||i+1)};
 });
}
export function validateBackup(data){
 if(data?.format!=='xiaoyu-study-backup'||data?.version!==1||!data.state||!Array.isArray(data.questions))throw Error('这不是有效的小宇刷题备份。');
 const bank=data.questions.length?validateQuestions(data.questions):[],s=data.state,ids=new Set(bank.map(q=>q.id));
 if(!Array.isArray(s.attempts)||s.attempts.length>500000||s.attempts.some(a=>!a||typeof a.id!=='string'||!ids.has(a.questionId)||!Number.isFinite(a.time)||![true,false,null].includes(a.correct)||!(typeof a.answer==='string'||Array.isArray(a.answer)&&a.answer.every(v=>typeof v==='string'))))throw Error('备份中的练习记录损坏。');
 if(!s.wrong||typeof s.wrong!=='object'||Array.isArray(s.wrong)||Object.entries(s.wrong).some(([id,t])=>!ids.has(id)||!Number.isFinite(t)))throw Error('备份中的错题记录损坏。');
 return {bank,state:{...initialState(),attempts:s.attempts,wrong:s.wrong,custom:bank,hidden:[],session:null}};
}
