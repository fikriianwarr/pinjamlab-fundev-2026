import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
export const isoNow=()=>new Date().toISOString();
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function addDays(day,n){return new Date(Date.parse(day+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);}
export function passwordHash(password){const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(password,salt,64).toString('hex');}
export function passwordMatches(password,stored){try{const [salt,hex]=stored.split(':');const actual=Buffer.from(hex,'hex'),test=scryptSync(password,salt,64);return actual.length===test.length&&timingSafeEqual(actual,test);}catch{return false;}}
export function openDatabase(file,{seed=true}={}){mkdirSync(dirname(file),{recursive:true});const db=new DatabaseSync(file);db.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));if(seed&&!db.prepare('SELECT COUNT(*) n FROM users').get().n)seedDatabase(db);return db;}
export function transaction(db,fn){db.exec('BEGIN IMMEDIATE');try{const v=fn();db.exec('COMMIT');return v;}catch(e){db.exec('ROLLBACK');throw e;}}
export function event(db,actor,type,id,action,detail){db.prepare('INSERT INTO events(actor_id,entity_type,entity_id,action,detail,created_at) VALUES(?,?,?,?,?,?)').run(actor,type,id,action,detail,isoNow());}
export function notify(db,user,title,body){db.prepare('INSERT INTO notifications(user_id,title,body,created_at) VALUES(?,?,?,?)').run(user,title,body,isoNow());}
export function available(db,asset,start,end,exclude=0){const reservations=db.prepare("SELECT quantity,starts_on,ends_on,status FROM loans WHERE asset_id=? AND id<>? AND ((status='approved' AND starts_on<? AND ends_on>?) OR (status='checked_out' AND starts_on<?))").all(asset.id,exclude,end,start,end);let peak=0;for(let day=start;day<end;day=addDays(day,1)){peak=Math.max(peak,reservations.filter(l=>l.starts_on<=day&&(l.status==='checked_out'||l.ends_on>day)).reduce((s,l)=>s+l.quantity,0));}return Math.max(0,asset.total-asset.maintenance-peak);}
export function seedDatabase(db){transaction(db,()=>{
 for(const p of [['learner@pinjamlab.local','Ari Pratama','2601001','student','LearnTogether!2026'],['lab@pinjamlab.local','Nadia Putri','','staff','CareForTools!2026'],['maya@pinjamlab.local','Maya Santoso','2601002','student','LearnTogether!2026'],['reza@pinjamlab.local','Reza Wijaya','2601003','student','LearnTogether!2026']])db.prepare('INSERT INTO users(email,name,student_id,role,password_hash) VALUES(?,?,?,?,?)').run(...p.slice(0,4),passwordHash(p[4]));
 const assets=[
 ['VIS-001','Mirrorless camera kit','Creative media','A camera, standard lens and spare battery for visual storytelling.','Media lab A','camera',4,0,['Photography','Video','Creative projects']],
 ['ELE-014','Arduino learning kit','Electronics','Build and test interactive projects with a microcontroller and reusable components.','Electronics lab','chip',10,0,['Microcontroller','Sensors','STEM']],
 ['SCI-006','Digital microscope','Science','Explore detailed specimens with a USB microscope and a stable stand.','Science lab B','scope',3,0,['Biology','Research','USB']],
 ['ELE-021','Digital multimeter','Electronics','Measure voltage, resistance and continuity for supervised circuit work.','Electronics lab','meter',6,1,['Circuits','Measurement','Safety']],
 ['MED-008','Portable audio recorder','Creative media','Capture clear interviews and field sound with a compact stereo recorder.','Media lab A','audio',4,0,['Audio','Interviews','Recording']],
 ['FAB-002','3D printing station','Fabrication','Reserve supervised station time for small learning and fabrication projects.','Maker room','printer',2,1,['Making','Design','Supervised']],
 ['ICT-011','Project laptop','Computing','A shared laptop for coursework and short project sessions.','Learning commons','laptop',6,0,['Coding','Coursework','Portable']],
 ['VIS-009','Tripod and lighting kit','Creative media','Keep your footage stable and control lighting for small productions.','Media lab A','tripod',7,0,['Lighting','Video','Support']],
 ['ELE-030','Environmental sensor kit','Electronics','Explore temperature, humidity and light using a reusable sensor collection.','Electronics lab','sensor',5,0,['Environment','Sensors','STEM']],
 ['ICT-018','Portable projector','Computing','Present group work and learning materials in a shared space.','Learning commons','projector',3,0,['Presentation','Classroom','Portable']],
 ['SCI-012','Digital measurement kit','Science','Collect repeatable physical measurements for classroom experiments.','Science lab B','ruler',4,0,['Experiments','Measurement','Research']],
 ['ICT-022','VR learning headset','Computing','Explore immersive learning experiences during supervised sessions.','Computing lab','vr',2,0,['Immersive','Learning','Supervised']]];
 for(const a of assets)db.prepare('INSERT INTO assets(code,name,category,description,location,icon,total,maintenance,tags) VALUES(?,?,?,?,?,?,?,?,?)').run(...a.slice(0,8),JSON.stringify(a[8]));
 const d=today();const loan=(user,asset,q,s,e,status,offset,condition=null,notes='')=>{const created=addDays(d,offset)+'T08:00:00.000Z';return Number(db.prepare('INSERT INTO loans(user_id,asset_id,quantity,starts_on,ends_on,purpose,status,created_at,approved_at,checked_out_at,returned_at,return_condition,return_notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(user,asset,q,addDays(d,s),addDays(d,e),'Coursework and collaborative learning',status,created,['approved','checked_out','returned'].includes(status)?created:null,['checked_out','returned'].includes(status)?created:null,status==='returned'?addDays(d,e-1)+'T09:00:00.000Z':null,condition,notes).lastInsertRowid);};
 loan(1,2,1,-1,2,'checked_out',-2);loan(3,1,1,1,3,'pending',-1);loan(4,3,1,0,2,'pending',0);loan(1,5,1,2,4,'approved',-1);for(const [i,a] of [1,2,4,5,7,8,9,10,11,2,1,7].entries())loan(i%2?3:1,a,1,-25+i*2,-23+i*2,'returned',-27+i*2,'good','Checked and ready for the next learner.');
 for(const [a,n] of [[4,'A lead needs replacement before this unit can be borrowed.'],[6,'Calibration and nozzle inspection are in progress.']])db.prepare("INSERT INTO maintenance(asset_id,quantity,status,note,created_at) VALUES(?,1,'open',?,?)").run(a,n,addDays(d,-2)+'T08:00:00.000Z');
 event(db,2,'workspace',0,'workspace_created','Illustrative equipment and loan records loaded for the sample workspace.');notify(db,1,'Your audio recorder is approved','Your reserved recorder is ready for pickup on '+addDays(d,2)+'.');
 });}
