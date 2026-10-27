/**
 * PinjamLab GitHub Pages prototype adapter.
 * All requests, identities, counters and records are simulated locally.
 * This is NOT a backend, real authentication or a multi-user system.
 * All records belong to the browser profile; no secrets or real accounts.
 */
const KEY = 'pinjamlab:pages-demo:v2';
let db;
const clock = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const add = (d,n) => new Date(Date.parse(`${d}T00:00:00Z`)+n*86400000).toISOString().slice(0,10);
const stamp=()=>new Date().toISOString();
function copy(v){return JSON.parse(JSON.stringify(v));}
function fail(message){throw Error(message);}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(db));}catch(e){fail('Browser storage is unavailable or full. Enable local storage to use the interactive demo.');}}
function relativeDate(value,oldDay,newDay){
  if(!value||typeof value!=='string'||!/^\d{4}-\d\d-\d\d/.test(value))return value;
  const delta=Math.round((Date.parse(value.slice(0,10)+'T00:00:00Z')-Date.parse(oldDay+'T00:00:00Z'))/86400000);
  return add(newDay,delta)+value.slice(10);
}
async function prepare(){
 if(db)return db;
 try{db=JSON.parse(localStorage.getItem(KEY)||'null');}catch{db=null;}
 if(db?.version===2)return db;
 const response=await fetch('./sample-data.json',{cache:'no-store'});
 if(!response.ok)fail('Sample records were not loaded. Open the site through a web server, not directly as a file.');
 const seed=await response.json(),base=seed.base_date,now=clock();
 for(const row of [...seed.loans,...seed.maintenance,...seed.events,...seed.notifications]){
  for(const field of Object.keys(row))if(/^(starts_on|ends_on|created_at|approved_at|checked_out_at|returned_at|resolved_at|read_at)$/.test(field)) row[field]=relativeDate(row[field],base,now);
 }
 db={version:2,assets:seed.assets,loans:seed.loans,maintenance:seed.maintenance,users:seed.users,events:seed.events,notifications:seed.notifications,activeUserId:null,serial:1000};
 persist();return db;
}
export function resetDemo(){localStorage.removeItem(KEY);db=null;}
function getUser(){return db.users.find(u=>u.id===db.activeUserId)||null;}
function session(){return {user:copy(getUser()),csrf:'browser-simulation',demo:true,today:clock()};}
function required(v,name,max=400){if(typeof v!=='string'||!v.trim()||v.trim().length>max)fail(`${name} is required and must be at most ${max} characters.`);return v.trim();}
function checkDate(start,end){
 for(const d of [start,end])if(typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d)||Number.isNaN(Date.parse(d+'T00:00:00Z'))||new Date(d+'T00:00:00Z').toISOString().slice(0,10)!==d)fail('Choose valid dates.');
 const n=(Date.parse(end)-Date.parse(start))/86400000;
 if(n<1||n>7)fail('Choose a loan of one to seven days.');
 if(start<clock()||start>add(clock(),90))fail('Choose a starting date within the next 90 days.');
 return [start,end];
}
function remaining(a,start,end,exclude=0){
 const reserved=db.loans.filter(l=>l.asset_id===a.id&&l.id!==exclude&&(
  (l.status==='approved'&&l.starts_on<end&&l.ends_on>start)||(l.status==='checked_out'&&l.starts_on<end)));
 let peak=0;
 for(let day=start;day<end;day=add(day,1)){
  peak=Math.max(peak,reserved.filter(l=>l.starts_on<=day&&(l.status==='checked_out'||l.ends_on>day)).reduce((n,l)=>n+l.quantity,0));
 }
 return Math.max(0,a.total-a.maintenance-peak);
}
function assets(start=clock(),end=add(clock(),1)){
 return db.assets.map(a=>({...a,available:remaining(a,start,end),uses:db.loans.filter(l=>l.asset_id===a.id&&l.status==='returned'&&l.returned_at>=add(clock(),-30)).length}));
}
function loans(user){
 return db.loans.filter(l=>user.role==='staff'||l.user_id===user.id).map(l=>{
  const a=db.assets.find(a=>a.id===l.asset_id),u=db.users.find(u=>u.id===l.user_id);
  const prior=db.loans.filter(q=>q.user_id===l.user_id&&q.status==='returned'&&q.returned_at>=add(clock(),-30)).length;
  return {...l,asset_name:a?.name||'Equipment',code:a?.code||'',icon:a?.icon||'chip',category:a?.category||'',borrower:u?.name||'Learner',student_id:u?.student_id||'',prior_loans:prior,priority_reason:prior===0?'First access in the last 30 days':`${prior} completed loan${prior===1?'':'s'} in the last 30 days`,overdue:l.status==='checked_out'&&l.ends_on<clock()};
 }).sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id-a.id);
}
function care(){return db.maintenance.map(m=>{const a=db.assets.find(a=>a.id===m.asset_id);return {...m,asset_name:a?.name||'Equipment',code:a?.code||'',icon:a?.icon||'chip'};}).sort((a,b)=>a.status.localeCompare(b.status)||b.created_at.localeCompare(a.created_at));}
function stats(){
 const a=assets();const completed=db.loans.filter(l=>l.status==='returned');
 const onTime=completed.filter(l=>l.returned_at&&l.returned_at.slice(0,10)<=l.ends_on).length;
 return {asset_types:a.length,total_units:a.reduce((x,y)=>x+y.total,0),available_units:a.reduce((x,y)=>x+y.available,0),maintenance_units:a.reduce((x,y)=>x+y.maintenance,0),active:db.loans.filter(l=>l.status==='checked_out').length,completed:completed.length,pending:db.loans.filter(l=>l.status==='pending').length,on_time:onTime,on_time_rate:completed.length?Math.round(onTime/completed.length*100):null,learners:new Set(db.loans.filter(l=>['approved','checked_out','returned'].includes(l.status)).map(l=>l.user_id)).size,repairs_completed:db.maintenance.filter(x=>x.status==='resolved').length,by_category:[...new Set(a.map(x=>x.category))].map(c=>({category:c,total:a.filter(x=>x.category===c).reduce((n,x)=>n+x.total,0),available:a.filter(x=>x.category===c).reduce((n,x)=>n+x.available,0)}))};
}
function event(user,type,id,action,detail){db.events.push({id:++db.serial,actor_id:user.id,entity_type:type,entity_id:id,action,detail,actor:user.name,created_at:stamp()});}
function notice(id,title,body){db.notifications.push({id:++db.serial,user_id:id,title,body,created_at:stamp(),read_at:null});}
function authenticated(){const u=getUser();if(!u)fail('Sign in with one of the sample accounts first.');return u;}
function requireStaff(u){if(u.role!=='staff')fail('This action is only available in the sample Lab Team workspace.');}
function urlPath(url){return new URL(url,'https://example.test').pathname;}
function loginResult(user){db.activeUserId=user.id;persist();return session();}
function sampleLogin(email,password){
 // These are public SAMPLE passwords from the source README. Never enter real credentials.
 const list={'learner@pinjamlab.local':'LearnTogether!2026','lab@pinjamlab.local':'CareForTools!2026','maya@pinjamlab.local':'LearnTogether!2026','reza@pinjamlab.local':'LearnTogether!2026'};
 const u=db.users.find(u=>u.email===String(email||'').trim().toLowerCase());
 if(!u||list[u.email]!==password)fail('Use the published sample login or the As a learner / As the lab team buttons.');
 return loginResult(u);
}
function validName(v,max){return String(v??'').trim().slice(0,max);}
export async function demoApi(path,options={}){
 await prepare();
 const p=urlPath(path),params=new URL(path,'https://example.test').searchParams;
 const b=options.body||{},isWrite=!!options.method;
 if(p==='/session')return session();
 if(p==='/auth/demo'){
  if(!['student','staff'].includes(b.role))fail('Choose a demo workspace.');
  return loginResult(db.users.find(u=>u.email===(b.role==='staff'?'lab@pinjamlab.local':'learner@pinjamlab.local')));
 }
 if(p==='/auth/login')return sampleLogin(b.email,b.password);
 if(p==='/auth/register')fail('Public prototype: registration is disabled. Use the sample workspace buttons without entering personal data.');
 if(p==='/auth/logout'){db.activeUserId=null;persist();return {ok:true};}
 const user=authenticated();
 if(p==='/bootstrap')return {user:copy(user),demo:true,today:clock(),assets:assets(),loans:loans(user),maintenance:user.role==='staff'?care():[],stats:stats(),notifications:db.notifications.filter(n=>n.user_id===user.id).sort((a,b)=>b.created_at.localeCompare(a.created_at))};
 if(p==='/availability'){
  const start=params.get('from')||clock();checkDate(start,add(start,7));
  const days=Array.from({length:7},(_,i)=>add(start,i));
  return {from:start,to:add(start,7),days,assets:db.assets.map(a=>({...a,available:days.map(d=>remaining(a,d,add(d,1)))}))};
 }
 if(p==='/assets'&&!isWrite){const start=params.get('from')||clock(),end=params.get('to')||add(clock(),1);checkDate(start,end);return {assets:assets(start,end),from:start,to:end};}
 if(p==='/assets'&&isWrite){
  requireStaff(user);
  const code=required(b.code,'Equipment code',30).toUpperCase(),name=required(b.name,'Equipment name',100),category=required(b.category,'Category',60),description=required(b.description,'Description',400),location=required(b.location,'Location',80),total=Number(b.total);
  if(db.assets.some(a=>a.code===code))fail('This equipment code is already in use.');
  if(!Number.isInteger(total)||total<1||total>200)fail('Choose one to 200 shared units.');
  const icon=['chip','camera','scope','meter','audio','printer','laptop','tripod','sensor','projector','ruler','vr'].includes(b.icon)?b.icon:'chip';
  const id=Math.max(0,...db.assets.map(a=>a.id))+1;
  db.assets.push({id,code,name,category,description,location,total,maintenance:0,icon,tags:[]});
  event(user,'asset',id,'inventory_added',`${name}: ${total} example units added.`);persist();return {id,message:'Equipment added to this browser demo.'};
 }
 let match=p.match(/^\/assets\/(\d+)$/);
 if(match){const start=params.get('from')||clock(),end=params.get('to')||add(clock(),1);checkDate(start,end);const list=assets(start,end),a=list.find(x=>x.id===Number(match[1]));if(!a)fail('Equipment not found.');return {asset:a,history:db.events.filter(e=>e.entity_type==='asset'&&e.entity_id===a.id).sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,20),alternatives:list.filter(x=>x.category===a.category&&x.id!==a.id&&x.available>0)};}
 if(p==='/loans'&&isWrite){
  if(user.role!=='student')fail('Use the sample learner workspace to request equipment.');
  const [start,end]=checkDate(b.starts_on,b.ends_on),qty=Number(b.quantity),aid=Number(b.asset_id),a=db.assets.find(x=>x.id===aid);
  required(b.purpose,'Learning purpose',400);
  if(!a)fail('Equipment not found.');if(!Number.isInteger(qty)||qty<1||qty>20)fail('Choose a quantity from 1 to 20.');
  if(remaining(a,start,end)<qty)fail('This quantity is not available for these dates.');
  if(db.loans.some(l=>l.user_id===user.id&&l.asset_id===aid&&l.starts_on===start&&l.ends_on===end&&['pending','approved','checked_out'].includes(l.status)))fail('You already have a request for this equipment and these dates.');
  const id=Math.max(0,...db.loans.map(l=>l.id))+1;
  db.loans.push({id,user_id:user.id,asset_id:aid,quantity:qty,starts_on:start,ends_on:end,purpose:validName(b.purpose,400),status:'pending',created_at:stamp(),approved_at:null,checked_out_at:null,returned_at:null,return_condition:null,return_notes:'',decision_note:''});
  event(user,'loan',id,'requested',`${a.name}: ${qty} unit(s), ${start} to ${end}.`);notice(user.id,'Request received',`${a.name} is awaiting sample lab review.`);persist();return {id,message:'Your demo request is with the lab team.'};
 }
 match=p.match(/^\/loans\/(\d+)\/(approve|reject|checkout|return|cancel)$/);
 if(match&&isWrite){
  const id=Number(match[1]),action=match[2],l=db.loans.find(l=>l.id===id);
  if(!l)fail('Loan not found.');if(action!=='cancel')requireStaff(user);else if(l.user_id!==user.id)fail('You cannot cancel another learner’s request.');
  const a=db.assets.find(x=>x.id===l.asset_id),notes=validName(b.note,400);
  if(action==='approve'){
   if(l.status!=='pending')fail('Only a pending request can be approved.');if(l.ends_on<=clock())fail('These dates have passed.');
   if(remaining(a,l.starts_on,l.ends_on,l.id)<l.quantity)fail('These units are reserved by another approved request.');
   l.status='approved';l.approved_at=stamp();l.decision_note=notes;
  } else if(action==='reject'){
   if(l.status!=='pending')fail('Only pending requests can be declined.');l.decision_note=required(b.note,'A reason',400);l.status='rejected';
  } else if(action==='checkout'){
   if(l.status!=='approved')fail('Approve this request before pickup.');
   if(l.starts_on>clock()||l.ends_on<=clock())fail('Pickup must be within approved dates.');
   if(remaining(a,clock(),add(clock(),1),l.id)<l.quantity)fail('Units are unavailable. Review equipment condition.');
   l.status='checked_out';l.checked_out_at=stamp();
  } else if(action==='return'){
   if(l.status!=='checked_out')fail('Only checked-out equipment can be returned.');
   if(!['good','repair','retire'].includes(b.condition))fail('Choose an equipment condition.');
   const note=validName(b.notes,500);if(b.condition!=='good'&&!note)fail('Describe the issue before holding the equipment.');
   if(b.condition!=='good'&&a.maintenance+l.quantity>a.total)fail('Too many units are on inspection hold.');
   l.status='returned';l.returned_at=stamp();l.return_condition=b.condition;l.return_notes=note;
   if(b.condition!=='good'){
    a.maintenance+=l.quantity;const mid=Math.max(0,...db.maintenance.map(m=>m.id))+1;
    db.maintenance.push({id:mid,asset_id:a.id,loan_id:id,quantity:l.quantity,status:'open',note,created_at:stamp(),resolved_at:null,resolution:null});
    event(user,'asset',a.id,'condition_flagged',`${l.quantity} unit(s) held for inspection: ${note}`);
   } else event(user,'asset',a.id,'returned_ready',`${l.quantity} unit(s) ready to share.`);
  } else if(action==='cancel'){
   if(!['pending','approved'].includes(l.status))fail('Only pending or approved requests can be cancelled.');l.status='cancelled';
  }
  event(user,'loan',id,action,`${a.name}: ${action}.`);
  notice(l.user_id,action==='return'?'Return recorded':`Request ${action==='approve'?'approved':action==='reject'?'declined':action==='checkout'?'collected':'cancelled'}`,`${a.name}. ${notes||validName(b.notes,500)}`);
  persist();return {ok:true,message:{approve:'Request approved.',reject:'Learner notified in this browser.',checkout:'Pickup recorded.',return:'Return and equipment condition recorded.',cancel:'Request cancelled.'}[action]};
 }
 match=p.match(/^\/maintenance\/(\d+)\/resolve$/);
 if(match&&isWrite){
  requireStaff(user);const note=required(b.note,'Repair or inspection notes',500),m=db.maintenance.find(x=>x.id===Number(match[1]));
  if(!m)fail('Inspection not found.');if(m.status!=='open')fail('Inspection is already complete.');
  const a=db.assets.find(x=>x.id===m.asset_id);if(a.maintenance<m.quantity)fail('Inspection hold is inconsistent.');
  m.status='resolved';m.resolved_at=stamp();m.resolution=note;a.maintenance-=m.quantity;
  event(user,'asset',a.id,'repair_completed',note);persist();return {ok:true,message:'Inspection completed. Equipment is available in this demo.'};
 }
 if(p==='/notifications/read'&&isWrite){db.notifications.filter(n=>n.user_id===user.id).forEach(n=>n.read_at||=stamp());persist();return {ok:true};}
 if(p==='/events'){requireStaff(user);return {events:copy(db.events).sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,150).map(e=>({...e,actor:db.users.find(u=>u.id===e.actor_id)?.name||e.actor||'Workspace'}))};}
 fail('This action is unavailable in the browser-only prototype.');
}
export async function exportCsv(){
 await prepare();const u=authenticated(),fields=['id','asset_name','code','borrower','student_id','quantity','starts_on','ends_on','status','return_condition','return_notes'];
 const cell=s=>'"'+String(s??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
 const body='\ufeff'+[fields.map(cell).join(','),...loans(u).map(l=>fields.map(k=>cell(l[k])).join(','))].join('\r\n');
 const blob=new Blob([body],{type:'text/csv;charset=utf-8'}),objectURL=URL.createObjectURL(blob),anchor=document.createElement('a');
 anchor.href=objectURL;anchor.download='pinjamlab-demo-loans.csv';document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(objectURL),2000);
}
