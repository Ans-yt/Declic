import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createCatalogue } from '../server/catalogue';
import { regionAt, type Boundaries } from '../src/geography';
import { suggestAwardTitle } from '../shared/award-title';

test('locates French regions from local outlines, including overseas, without a geocoding service',()=>{
  const regions=JSON.parse(readFileSync('assets/geography/regions.geojson','utf8')) as Boundaries;
  assert.equal(regionAt(regions,48.8566,2.3522),'Île-de-France');assert.equal(regionAt(regions,43.6047,1.4442),'Occitanie');assert.equal(regionAt(regions,-20.8789,55.4481),'La Réunion');assert.equal(regionAt(regions,40.71,-74),null);
});
test('map exports cover all matching courses and group establishments by UAI and locality rather than courses',async()=>{
  const db=new DatabaseSync(':memory:'); const calls:URL[]=[];
  const fetcher=(async(input:string|URL|Request)=>{const url=new URL(String(input));calls.push(url);let body:unknown;
    if(url.searchParams.get('group_by')==='annee')body={total_count:1,results:[{annee:'2026'}]};
    else if(url.pathname.includes('/exports/'))body=[{etab_uai:'UAI1',etab_nom:'School',commune:'Paris',region:'Île-de-France',etab_gps:{lat:48.8,lon:2.3}},{etab_uai:'UAI1',etab_nom:'School',commune:'Paris',region:'Île-de-France',etab_gps:{lat:48.80001,lon:2.30001}},{etab_uai:'UAI2',etab_nom:'Second',commune:'Paris',region:'Île-de-France',etab_gps:{lat:48.8,lon:2.3}},{etab_uai:'MISSING',etab_nom:'No coordinates'}];
    else body={metas:{default:{data_processed:'2026-10-01'}}};
    return new Response(JSON.stringify(body));}) as typeof fetch;
  try{const data=await createCatalogue(db,fetcher).map('maths', {region:'Île-de-France',institution:'UAI1'});assert.equal(data.courses,4);assert.equal(data.establishments.length,2);assert.equal(data.establishments[0].courses,2);assert.equal(data.unmapped,1);assert.equal(data.year,2026);const exported=calls.find(u=>u.pathname.includes('/exports/'))!;assert.equal(exported.searchParams.get('limit'),'-1');assert.ok(exported.searchParams.get('where')!.includes('region="Île-de-France"'));assert.ok(exported.searchParams.get('where')!.includes('etab_uai="UAI1"'));assert.equal(exported.searchParams.get('select')!.includes('nm'),false);}finally{db.close();}
});
test('OCR suggests recognised award names but never invents a title from noise',()=>{assert.equal(suggestAwardTitle('BREVET D’INITIATION AÉRONAUTIQUE\nBIA 2026'),'Brevet d’initiation aéronautique (BIA)');assert.equal(suggestAwardTitle('Diplôme de participation au concours'), 'Diplôme de participation au concours');assert.equal(suggestAwardTitle('||| 000\nQww 7'),null);});
