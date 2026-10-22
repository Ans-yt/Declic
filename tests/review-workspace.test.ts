import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { createApp } from '../server/app';
import { readConfig } from '../server/config';
import { hashPassword } from '../server/auth';
import { blankCV, blankPlanner, blankProfile } from '../shared/models';
import { readComparison } from '../src/lib/comparison';

let runtime: ReturnType<typeof createApp>, server: Server, origin: string;
type Jar = Map<string,string>;
const a: Jar = new Map(), b: Jar = new Map();
async function request(jar: Jar, path: string, method = 'GET', body?: unknown, status = 200) {
  const response = await fetch(origin + '/api' + path, { method, headers: {'Content-Type':'application/json', Cookie:[...jar].map(([k,v])=>k+'='+v).join('; ')}, body: body === undefined ? undefined : JSON.stringify(body) });
  for (const cookie of response.headers.getSetCookie()) {const [k,v] = cookie.split(';')[0].split('='); jar.set(k,v);}
  const value = await response.json(); assert.equal(response.status,status,JSON.stringify(value)); return value;
}
before(async()=>{
  runtime = createApp(':memory:', {config:{...readConfig({}),staffUsername:'review-test',staffPasswordHash:await hashPassword('review-only-password')}});
  server = await new Promise<Server>(resolve=>{const s=runtime.app.listen(0,'127.0.0.1',()=>resolve(s));});
  const addr=server.address(); if(!addr || typeof addr==='string')throw Error('Missing port'); origin='http://127.0.0.1:'+addr.port;
});
after(async()=>{await new Promise<void>(resolve=>server.close(()=>resolve()));runtime.close();});

test('planner notes and personal dates persist and remain isolated between visitors',async()=>{
  const planner={notes:[{programmeId:'2026:123',note:'Mon projet personnel',question:'Portes ouvertes ?'}],tasks:[{id:crypto.randomUUID(),programmeId:'2026:123',title:'Préparer mes questions',dueDate:'2026-10-25',done:false}]};
  const saved=await request(a,'/planner','PUT',planner); assert.deepEqual(saved.planner,planner);
  assert.deepEqual((await request(a,'/workspace')).planner,planner);
  const other=await request(b,'/workspace'); assert.deepEqual(other.planner,blankPlanner);assert.notEqual(other.draftKey,saved.draftKey);
  await request(a,'/planner','PUT',{...planner,tasks:[{...planner.tasks[0],dueDate:'2026-02-30'}]},400);
  await request(a,'/planner','PUT',{...planner,notes:[planner.notes[0],planner.notes[0]]},400);
  assert.deepEqual((await request(a,'/workspace')).planner,planner);
});
test('personal backup round-trips, excludes protected workflows and rejects invalid imports atomically',async()=>{
  const profile={...blankProfile,firstname:'Profil fictif sauvegardé'};
  await request(a,'/profile','PUT',profile);await request(a,'/saved','PUT',['2026:123']);
  const backup=await request(a,'/backup');assert.equal(backup.version,1);assert.equal(backup.format,'declic-personal-backup');assert.equal(backup.applications,undefined);assert.equal(backup.draftKey,undefined);
  await request(b,'/backup','POST',backup);const restored=await request(b,'/workspace');assert.deepEqual(restored.profile,profile);assert.deepEqual(restored.planner,backup.planner);assert.deepEqual(restored.saved,['2026:123']);
  await request(b,'/backup','POST',{...backup,profile:{...profile,firstname:'Must not be written'},saved:['invalid']},400);
  assert.equal((await request(b,'/workspace')).profile.firstname,profile.firstname);
  await request(b,'/backup','POST',{...backup,applications:[]},400);
  await request(b,'/backup','POST',{...backup,version:2},400);
  await request(b,'/backup','POST',{...backup,cv:{...blankCV,awards:[{id:crypto.randomUUID(),title:'Fictif',organization:'',date:'',detail:'',attachmentId:crypto.randomUUID()}]}},400);
});
test('guided scenario requires staff, is opt-in and idempotent, and creates no automatic decision',async()=>{
  assert.equal((await request(a,'/workspace')).applications.length,0);
  await request(a,'/demo/scenario','POST',{language:'fr'},401);
  await request(a,'/auth/login','POST',{username:'review-test',password:'review-only-password'});
  const first=await request(a,'/demo/scenario','POST',{language:'en'},201);assert.equal(first.applications.length,1);assert.match(first.applications[0].formation,/Fictional/);assert.equal(first.applications[0].review,null);assert.equal(first.applications[0].status,'pending');
  const second=await request(a,'/demo/scenario','POST',{language:'fr'});assert.equal(second.applications.length,1);assert.equal(second.demoApplicationId,first.demoApplicationId);
  assert.equal((await request(b,'/workspace')).applications.length,0);
  const backup=await request(a,'/backup');assert.equal(backup.applications,undefined);
});
test('comparison recovery tolerates corrupt storage, removes duplicates and limits the selection',()=>{
  assert.deepEqual(readComparison('{broken'),[]);assert.deepEqual(readComparison('{}'),[]);
  assert.deepEqual(readComparison(JSON.stringify(['2026:1','2026:1',1,'bad','2026:2','2026:3','2026:4','2026:5'])),['2026:1','2026:2','2026:3','2026:4']);
});
