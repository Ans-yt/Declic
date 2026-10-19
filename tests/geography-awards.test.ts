import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createCatalogue } from '../server/catalogue';
import { classifyEstablishments, departmentColourIndexes, departmentPalette, regionAt, spatialLookup, type Boundaries, type Countries } from '../src/geography';
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

test('campuses abroad are classified by geography while French overseas territories stay in France',()=>{
  const regions=JSON.parse(readFileSync('assets/geography/regions.geojson','utf8')) as Boundaries;
  const countries=JSON.parse(readFileSync('assets/geography/countries.geojson','utf8')) as Countries;
  const base={id:'fixture',code:'UAI',name:'Fictional campus',city:'Test',region:'Île-de-France',courses:1};
  const points=classifyEstablishments([{...base,id:'paris',lat:48.8566,lon:2.3522},{...base,id:'london',lat:51.5074,lon:-0.1278},{...base,id:'barcelona',lat:41.3874,lon:2.1686},{...base,id:'reunion',lat:-20.8789,lon:55.4481}],regions,countries);
  assert.equal(points[0].abroad,false);assert.equal(points[1].abroad,true);assert.equal(points[1].country?.code,'GB');assert.equal(points[2].country?.code,'ES');assert.equal(points[3].abroad,false);
  const unknown=classifyEstablishments([{...base,lat:0,lon:0}],regions,countries)[0];assert.equal(unknown.uncertain,true);assert.equal(unknown.abroad,false);assert.equal(unknown.country,null);
});
test('adjacent departments receive distinct stable colours and spatial lookups respect polygon holes',()=>{
  const boundaries:Boundaries={type:'FeatureCollection',features:[{type:'Feature',properties:{code:'A',nom:'A'},geometry:{type:'Polygon',coordinates:[[[0,0],[1,0],[1,1],[0,1],[0,0]]]}},{type:'Feature',properties:{code:'B',nom:'B'},geometry:{type:'Polygon',coordinates:[[[1,0],[2,0],[2,1],[1,1],[1,0]]]}}]};
  const colors=departmentColourIndexes(boundaries);assert.notEqual(colors.A,colors.B);assert.deepEqual(colors,departmentColourIndexes(boundaries));assert.ok(Object.values(colors).every(index=>index<departmentPalette.length));
  boundaries.features[0].geometry={type:'Polygon',coordinates:[[[0,0],[1,0],[1,1],[0,1],[0,0]],[[0.3,0.3],[0.7,0.3],[0.7,0.7],[0.3,0.7],[0.3,0.3]]]};
  const lookup=spatialLookup(boundaries);assert.equal(lookup(0.1,0.1)?.properties.code,'A');assert.equal(lookup(0.5,0.5),null);assert.equal(lookup(5,5),null);
});
