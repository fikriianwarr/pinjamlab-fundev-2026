import {existsSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {openDatabase,passwordHash,event} from './db.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),file=process.env.PINJAMLAB_DB||path.join(root,'data','pinjamlab.sqlite');
const args=process.argv.slice(2),command=args.shift(),option=name=>{const i=args.indexOf(name);return i<0?'':args[i+1]||'';};let db;
try{
 if(!['create-staff','backup','check'].includes(command))throw new Error('Use: node manage.mjs create-staff --email EMAIL --name NAME | backup --out FILE | check');
 if(command==='create-staff'){
  const email=option('--email').trim().toLowerCase(),name=option('--name').trim(),password=process.env.PINJAMLAB_ADMIN_PASSWORD||'';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>160)throw new Error('Provide a valid --email.');
  if(!name||name.length>100)throw new Error('Provide --name, up to 100 characters.');
  if(password.length<12||password.length>256)throw new Error('Set PINJAMLAB_ADMIN_PASSWORD to a password of 12–256 characters.');
  db=openDatabase(file,{seed:false});if(db.prepare('SELECT id FROM users WHERE email=?').get(email))throw new Error('This email already exists. No account was changed.');
  const id=Number(db.prepare("INSERT INTO users(email,name,student_id,role,password_hash) VALUES(?,?,'','staff',?)").run(email,name,passwordHash(password)).lastInsertRowid);event(db,id,'workspace',0,'staff_created','A lab team account was created through the local administration utility.');console.log('Lab team account created. Start the server in production mode and sign in.');
 }else{
  if(!existsSync(file))throw new Error('The database does not exist yet. Start the app or create a staff account first.');db=openDatabase(file,{seed:false});
  if(command==='backup'){
   const out=option('--out');if(!out)throw new Error('Provide --out with a new backup filename.');const target=path.resolve(out);if(existsSync(target))throw new Error('The backup destination already exists. Choose a new filename.');mkdirSync(path.dirname(target),{recursive:true});db.prepare('VACUUM INTO ?').run(target);console.log('Consistent database backup created.');
  }else{
   const integrity=db.prepare('PRAGMA quick_check').get().quick_check,foreignKeys=db.prepare('PRAGMA foreign_key_check').all(),counts=db.prepare("SELECT a.code FROM assets a WHERE a.maintenance != (SELECT COALESCE(SUM(m.quantity),0) FROM maintenance m WHERE m.asset_id=a.id AND m.status='open')").all();if(integrity!=='ok'||foreignKeys.length||counts.length)throw new Error('Database checks failed. Review the inventory and restore a verified backup if necessary.');console.log('Database integrity, references and maintenance totals: OK.');
  }
 }
}catch(error){console.error(error.message);process.exitCode=1;}finally{db?.close();}
