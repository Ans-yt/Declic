import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest, type Server } from 'node:http';
import sharp from 'sharp';
import { createApp } from '../server/app';
import { hashPassword } from '../server/auth';
import { readConfig } from '../server/config';
import { blankCV, blankProfile } from '../shared/models';

let runtime: ReturnType<typeof createApp>, server: Server, origin: string;
before(async () => { runtime = createApp(':memory:', { config: { ...readConfig({}), staffUsername:'school-admin', staffPasswordHash:await hashPassword('test-only-strong-password'), institution:'Test institution', integrationToken:'test-only-integration-token-0123456789', oidcIssuer:'https://identity.example' } }); server = await new Promise<Server>(resolve => { const s=runtime.app.listen(0,'127.0.0.1',()=>resolve(s)); }); const address=server.address(); if(!address || typeof address==='string') throw new Error(); origin=`http://127.0.0.1:${address.port}`; });
after(async()=>{ await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve())); runtime.close(); });
function client() {
  const cookies = new Map<string,string>();
  async function request(path: string, method='GET', body?: unknown, headers: Record<string,string>={}) {
    const multipart = body instanceof FormData;
    const response=await fetch(origin+'/api'+path,{ method,headers:{ ...(!multipart ? { 'Content-Type':'application/json' } : {}),Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; '),...headers },body:body===undefined?undefined:multipart?body:JSON.stringify(body) });
    for(const item of response.headers.getSetCookie()){ const [k,v]=item.split(';')[0].split('='); cookies.set(k,v); }
    return response;
  }
  return { request,cookies };
}

test('staff pages are backed by server authorization, not a client-side role',async()=>{
  const visitor=client(); await visitor.request('/workspace');
  for(const path of ['/needs','/candidates','/applications']) assert.equal((await visitor.request(path,'POST',{ role:'staff' })).status,401);
  assert.equal((await visitor.request('/needs/missing/matches')).status,401);
  assert.equal((await visitor.request('/auth/login','POST',{username:'wrong',password:'test-only-strong-password'})).status,401);
  assert.equal((await visitor.request('/auth/session').then(r=>r.json())).staff,null);
});
test('each visitor has an isolated persisted workspace and tampered cookies cannot select another one',async()=>{
  const a=client(),b=client(); await a.request('/workspace'); await b.request('/workspace');
  assert.equal((await a.request('/profile','PUT',{ ...blankProfile,firstname:'Private visitor A' })).status,200);
  assert.equal((await b.request('/workspace').then(r=>r.json())).profile.firstname,'');
  assert.equal((await a.request('/workspace').then(r=>r.json())).profile.firstname,'Private visitor A');
  b.cookies.set('declic_visitor','legacy');
  assert.equal((await b.request('/workspace').then(r=>r.json())).profile.firstname,'');
});
test('password sign-in uses an opaque HttpOnly cookie, and logout revokes it on the server',async()=>{
  const visitor=client(); await visitor.request('/workspace');
  const result=await visitor.request('/auth/login','POST',{username:'school-admin',password:'test-only-strong-password'});
  assert.equal(result.status,200); assert.match(result.headers.get('set-cookie')!,/HttpOnly/); assert.match(result.headers.get('set-cookie')!,/SameSite=Lax/);
  const session=await visitor.request('/auth/session').then(r=>r.json()); assert.equal(session.staff.institution,'Test institution'); assert.equal(JSON.stringify(session).includes('scrypt'),false);
  const stolen=client(); for(const [k,v] of visitor.cookies) stolen.cookies.set(k,v);
  assert.equal((await visitor.request('/needs','POST',{})).status,400);
  await visitor.request('/auth/logout','POST',{});
  assert.equal((await stolen.request('/needs','POST',{})).status,401);
});
test('diploma images are re-encoded, saved in the CV, and inaccessible to other visitors',async()=>{
  const a=client(),b=client(); await a.request('/workspace'); await b.request('/workspace');
  const image=await sharp({create:{width:300,height:180,channels:3,background:'#f7efe9'}}).png().toBuffer();
  const form=new FormData();form.append('image',new Blob([new Uint8Array(image)],{type:'image/png'}),'diploma.png');
  const upload=await a.request('/attachments','POST',form);assert.equal(upload.status,201);const attachment=await upload.json();
  const received=await a.request('/attachments/'+attachment.id);assert.equal(received.headers.get('content-type'),'image/webp');assert.equal(received.headers.get('cache-control'),'no-store');
  assert.equal((await b.request('/attachments/'+attachment.id)).status,404);
  const cv={...blankCV,awards:[{id:crypto.randomUUID(),title:'BIA — fixture',organization:'Test',date:'2026',detail:'Fictional test data',attachmentId:attachment.id}]};
  assert.equal((await a.request('/cv','PUT',cv)).status,200);
  assert.deepEqual((await a.request('/workspace').then(r=>r.json())).cv.awards,cv.awards);
  assert.equal((await b.request('/cv','PUT',cv)).status,400);
  assert.equal((await a.request('/attachments/'+attachment.id,'DELETE')).status,409);
  await a.request('/cv','PUT',blankCV);assert.equal((await a.request('/attachments/'+attachment.id,'DELETE')).status,200);
  assert.equal((await a.request('/attachments/'+attachment.id)).status,404);
});
test('a spoofed image type and corrupt file cannot enter the proof store',async()=>{
  const visitor=client();await visitor.request('/workspace');
  for(const content of ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>','not an image']){
    const form=new FormData();form.append('image',new Blob([content],{type:'image/png'}),'spoof.png');assert.equal((await visitor.request('/attachments','POST',form)).status,400);
  }
});
test('identity provisioning requires a secret, exact issuer and prior institutional approval',async()=>{
  const visitor=client();const identity={issuer:'https://identity.example',subject:'opaque-professor-id',staffId:'teacher-123',name:'Test teacher',institution:'Test school',active:true};
  assert.equal((await visitor.request('/integrations/identities','POST',identity)).status,401);
  const headers={Authorization:'Bearer test-only-integration-token-0123456789'};
  assert.equal((await visitor.request('/integrations/identities','POST',{...identity,issuer:'https://other.example'},headers)).status,400);
  assert.equal((await visitor.request('/integrations/identities','POST',identity,headers)).status,201);
  assert.equal((await visitor.request('/auth/oidc/callback?subject=opaque-professor-id&role=admin')).status,400);
  assert.equal((await visitor.request('/auth/oidc/start')).status,503);
  assert.equal((await visitor.request('/auth/session').then(r=>r.json())).staff,null);
});
test('public deployment validates HTTPS configuration and rejects unknown hosts and cross-origin uploads',async()=>{
  assert.throws(()=>readConfig({NODE_ENV:'production'}),/APP_ORIGIN/);
  assert.throws(()=>readConfig({NODE_ENV:'production',APP_ORIGIN:'http://example.com'}),/HTTPS/);
  assert.throws(()=>readConfig({DECLIC_STAFF_PASSWORD_HASH:'plaintext'}),/HASH/);
  const visitor=client();
  const invalidHost = await new Promise<number>(resolve => { const request=httpRequest(origin+'/api/workspace',{headers:{Host:'unknown.example'}},response=>{response.resume();resolve(response.statusCode!);});request.end(); });
  assert.equal(invalidHost,403);
  const form=new FormData();form.append('image',new Blob(['fake']),'fake.png');assert.equal((await visitor.request('/attachments','POST',form,{Origin:'https://untrusted.example'})).status,403);
});
test('repeated wrong passwords are rate limited',async()=>{
  const visitor=client();await visitor.request('/workspace');
  for(let i=0;i<8;i++) await visitor.request('/auth/login','POST',{username:'school-admin',password:'incorrect'});
  const response=await visitor.request('/auth/login','POST',{username:'school-admin',password:'test-only-strong-password'});assert.equal(response.status,429);assert.equal(response.headers.get('retry-after'),'900');
});
