import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import Supercluster, { type ClusterProperties } from 'supercluster';
import type { Feature, Point } from 'geojson';
import type { Establishment, EstablishmentMap } from '../shared/catalogue';
import { api } from './api';
import { getLanguage, formatNumber, formatDate, tr } from './i18n';
import { Icon } from './ui';
import { classifyEstablishments, departmentColourIndexes, departmentPalette, loadBoundaries, loadCountries, regionAt, type Boundaries, type Countries, type MappedEstablishment } from './geography';
import 'leaflet/dist/leaflet.css';

type PointProperties = { establishment: MappedEstablishment };
type Geography = { regions: Boundaries; departments: Boundaries; countries: Countries | null };
const globe = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7"/><ellipse cx="10" cy="10" rx="3" ry="7"/><path d="M3 10h14"/></svg>';
const countryName = (e: MappedEstablishment) => e.country ? (getLanguage()==='fr' ? e.country.fr : e.country.en) : tr('Localisation publiée', 'Published location');

export default function FranceMap({ query, region, onRegion, onInstitution }: { query: string; region: string; onRegion: (v: string) => void; onInstitution: (v: Establishment) => void }) {
  const container=useRef<HTMLDivElement>(null),mapRef=useRef<L.Map|null>(null),locationRef=useRef<L.LayerGroup|null>(null);
  const [data,setData]=useState<EstablishmentMap|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0),[loading,setLoading]=useState(true);
  const [geography,setGeography]=useState<Geography|null>(null),[boundariesError,setBoundariesError]=useState(false);
  const [locating,setLocating]=useState(false),[locationMessage,setLocationMessage]=useState(''),[zoom,setZoom]=useState(5),[activeCountry,setActiveCountry]=useState('');
  const language=getLanguage(),detailed=zoom>=7;
  const callbacks=useRef({onRegion,onInstitution});callbacks.current={onRegion,onInstitution};
  const locationRequest=useRef(0),pendingLocation=useRef<{lat:number;lon:number;region:string}|null>(null);

  useEffect(()=>{
    let active=true;const controller=new AbortController();setLoading(true);setError('');setData(null);
    api<EstablishmentMap>(`/catalogue/map?${new URLSearchParams({q:query,region})}`,'GET',undefined,controller.signal).then(result=>{if(active){setData(result);setLoading(false);}}).catch(()=>{if(active){setError(tr('La carte des établissements est indisponible. La recherche reste accessible ci-dessous.','The establishment map is unavailable. You can still search below.'));setLoading(false);}});
    return()=>{active=false;controller.abort();};
  },[query,region,retry]);
  useEffect(()=>{
    let active=true;setBoundariesError(false);
    Promise.all([loadBoundaries(),loadCountries().catch(()=>null)]).then(([boundaries,countries])=>{if(active)setGeography({...boundaries,countries});}).catch(()=>{if(active)setBoundariesError(true);});
    return()=>{active=false;};
  },[retry]);
  const mapped=useMemo(()=>data&&geography?classifyEstablishments(data.establishments,geography.regions,geography.countries):[],[data,geography]);
  const foreignGroups=useMemo(()=>{
    const groups=new Map<string,{key:string;sample:MappedEstablishment;sites:MappedEstablishment[]}>();
    for(const e of mapped)if(e.abroad){const key=e.country?.code||'other';const group=groups.get(key)||{key,sample:e,sites:[]};group.sites.push(e);groups.set(key,group);}
    return [...groups.values()].sort((a,b)=>b.sites.length-a.sites.length);
  },[mapped]);
  const indexes=useMemo(()=>[0,1,2].map(kind=>new Supercluster<PointProperties>({radius:76,maxZoom:20}).load(mapped.filter(e=>(e.uncertain?2:e.abroad?1:0)===kind).map(establishment=>({type:'Feature',geometry:{type:'Point',coordinates:[establishment.lon,establishment.lat]},properties:{establishment}} as Feature<Point,PointProperties>)))),[mapped]);
  const uncertainCount=mapped.filter(e=>e.uncertain).length;
  const departmentColors=useMemo(()=>geography?departmentColourIndexes(geography.departments):{},[geography]);

  useEffect(()=>{
    if(!container.current)return;
    const map=L.map(container.current,{center:[46.6,2.4],zoom:5,minZoom:2,maxZoom:20,preferCanvas:false,zoomControl:false,scrollWheelZoom:true,touchZoom:true,zoomSnap:0.25,zoomDelta:0.5,wheelDebounceTime:20,wheelPxPerZoomLevel:100,inertiaMaxSpeed:1200,worldCopyJump:true,zoomAnimation:!matchMedia('(prefers-reduced-motion: reduce)').matches});
    mapRef.current=map;map.attributionControl.setPrefix(false);
    for(const [name,zIndex] of [['countries',200],['departments',410],['regional-borders',420],['map-labels',450]] as const){map.createPane(name).style.zIndex=String(zIndex);}
    map.getPane('countries')!.style.pointerEvents='none';map.getPane('map-labels')!.style.pointerEvents='none';
    map.attributionControl.addAttribution('<a href="https://github.com/datagouv/contours-administratifs" target="_blank" rel="noopener noreferrer">IGN / Etalab 2025</a> · <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">Natural Earth</a>');
    locationRef.current=L.layerGroup().addTo(map);
    map.on('zoomend',()=>setZoom(map.getZoom()));
    const resize=new ResizeObserver(()=>map.invalidateSize());resize.observe(container.current);
    return()=>{locationRequest.current++;resize.disconnect();map.remove();mapRef.current=null;};
  },[]);
  useEffect(()=>{const map=mapRef.current;if(!map)return;const control=L.control.zoom({zoomInTitle:tr('Zoomer','Zoom in'),zoomOutTitle:tr('Dézoomer','Zoom out')}).addTo(map);return()=>{control.remove();};},[language]);

  useEffect(()=>{
    const map=mapRef.current;if(!map||!geography?.countries)return;
    const land=L.geoJSON(geography.countries,{pane:'countries',interactive:false,style:{noClip:true,color:'#b9bdb8',weight:0.75,fillColor:'#e3e5df',fillOpacity:0.9} as L.PolylineOptions}).addTo(map);
    const labels=L.layerGroup().addTo(map);
    for(const feature of geography.countries.features)if(['GB','IE','BE','NL','LU','DE','CH','IT','ES','PT','AD','MC'].includes(feature.properties.code)){
      const text=document.createElement('span');text.textContent=language==='fr'?feature.properties.nom:feature.properties.name;
      L.marker(feature.properties.label,{pane:'map-labels',interactive:false,keyboard:false,icon:L.divIcon({className:'country-map-label',html:text,iconSize:[110,24],iconAnchor:[55,12]})}).addTo(labels);
    }
    return()=>{land.remove();labels.remove();};
  },[geography?.countries,language]);
  useEffect(()=>{
    const map=mapRef.current;if(!map||!geography)return;
    const layer=L.layerGroup().addTo(map),labels=L.layerGroup().addTo(map);
    const selectedCode=geography.regions.features.find(f=>f.properties.nom===region)?.properties.code;
    if(detailed)L.geoJSON(geography.departments,{pane:'departments',interactive:true,style:feature=>({noClip:true,color:'#fffdf8',weight:1.8,fillColor:departmentPalette[departmentColors[feature!.properties.code]||0],fillOpacity:!selectedCode||feature?.properties.region===selectedCode?0.83:0.33,smoothFactor:1.1}),onEachFeature(feature,shape){
      const text=document.createElement('span');text.textContent=feature.properties.code+' · '+feature.properties.nom;
      shape.bindTooltip(text,{sticky:false,direction:'top',className:'boundary-tooltip'});
      shape.on('click',()=>map.fitBounds((shape as L.Polygon).getBounds(),{padding:[35,35],maxZoom:11,animate:false}));
      if(feature.properties.region===selectedCode){const text=document.createElement('span');text.textContent=feature.properties.code;L.marker((shape as L.Polygon).getBounds().getCenter(),{pane:'map-labels',interactive:false,keyboard:false,icon:L.divIcon({className:'department-map-label',html:text,iconSize:[34,22],iconAnchor:[17,11]})}).addTo(labels);}
    }}).addTo(layer);
    L.geoJSON(geography.regions,{pane:'regional-borders',interactive:!detailed,style:feature=>({noClip:true,color:feature?.properties.nom===region?'#4c3522':'#79624e',weight:detailed?1.5:1.15,fillColor:feature?.properties.nom===region?'#efd6b9':'#f4eadb',fillOpacity:detailed?0:0.88,smoothFactor:1.1}),onEachFeature(feature,shape){
      if(!detailed){const text=document.createElement('span');text.textContent=feature.properties.nom;shape.bindTooltip(text,{sticky:false,direction:'top'});shape.on('click',()=>callbacks.current.onRegion(feature.properties.nom));
        if(['11','24','27','28','32','44','52','53','75','76','84','93','94'].includes(feature.properties.code)){const label=document.createElement('span');label.textContent=feature.properties.nom;L.marker((shape as L.Polygon).getBounds().getCenter(),{pane:'map-labels',interactive:false,keyboard:false,icon:L.divIcon({className:'region-map-label',html:label,iconSize:[110,28],iconAnchor:[55,14]})}).addTo(labels);}
      }
    }}).addTo(layer);
    return()=>{layer.remove();labels.remove();};
  },[geography,departmentColors,detailed,region]);

  useEffect(()=>{
    const map=mapRef.current;if(!map)return;let active=true;setActiveCountry('');
    if(pendingLocation.current?.region===region){const point=pendingLocation.current;pendingLocation.current=null;map.setView([point.lat,point.lon],11,{animate:false});return;}
    if(!region){map.setView([46.6,2.4],5,{animate:false});return;}
    loadBoundaries().then(boundaries=>{if(!active)return;const feature=boundaries.regions.features.find(f=>f.properties.nom===region);if(feature){if(region==='Polynésie française')map.setView([-17.7,-149.5],5);else map.fitBounds(L.geoJSON(feature).getBounds(),{padding:[28,28],maxZoom:9,animate:false});}}).catch(()=>{});
    return()=>{active=false;};
  },[region]);

  useEffect(()=>{
    const map=mapRef.current;if(!map||!mapped.length)return;
    const layer=L.layerGroup().addTo(map),markers=new Map<string,L.Marker>();let frame=0;
    function establishmentNode(e:MappedEstablishment){
      const wrapper=document.createElement('div'),title=document.createElement('strong'),place=document.createElement('p'),button=document.createElement('button');
      if(e.abroad){const tag=document.createElement('span');tag.className='popup-abroad-label';tag.textContent=tr('Campus à l’étranger','Campus abroad');wrapper.append(tag);}
      if(e.uncertain){const tag=document.createElement('span');tag.className='popup-position-label';tag.textContent=tr('Position publiée · contours insuffisants','Published position · insufficient boundary detail');wrapper.append(tag);}
      title.textContent=e.name;place.textContent=`${e.city}${e.abroad?' · '+countryName(e):''} · ${e.courses} ${tr('formation(s)','programme(s)')}`;
      button.type='button';button.className='text-link';button.textContent=tr('Voir les formations','View programmes');button.onclick=()=>callbacks.current.onInstitution(e);wrapper.append(title,place,button);return wrapper;
    }
    function draw(){
      const bounds=map!.getBounds().pad(0.3),visible=new Set<string>();
      indexes.forEach((index,source)=>{
        for(const feature of index.getClusters([bounds.getWest(),bounds.getSouth(),bounds.getEast(),bounds.getNorth()],Math.floor(map!.getZoom()))){
          const [lon,lat]=feature.geometry.coordinates,cluster='cluster' in feature.properties&&feature.properties.cluster;
          const key=source+':'+(cluster?'c'+(feature.properties as ClusterProperties).cluster_id:'p'+(feature.properties as PointProperties).establishment.id);visible.add(key);
          if(markers.has(key))continue;
          let marker:L.Marker;
          if(cluster){
            const {point_count:count,cluster_id:id}=feature.properties as ClusterProperties;
            const size=count>=100?40:count>=10?34:30;
            const label=document.createElement('span');label.textContent=formatNumber(count);
            marker=L.marker([lat,lon],{title:`${count} ${source===1?tr('campus à l’étranger : zoomer','campuses abroad: zoom in'):source===2?tr('positions publiées : zoomer','published positions: zoom in'):tr('sites : zoomer','sites: zoom in')}`,icon:L.divIcon({className:'school-cluster'+(source===1?' abroad-cluster':source===2?' uncertain-cluster':''),html:label,iconSize:[size,size],iconAnchor:[size/2,size/2]})});
            marker.on('click',()=>{if(map!.getZoom()<20)map!.setView([lat,lon],Math.min(20,index.getClusterExpansionZoom(id)),{animate:false});else{const panel=document.createElement('div');panel.className='shared-campus';index.getLeaves(id,count).forEach(leaf=>panel.append(establishmentNode(leaf.properties.establishment)));marker.bindPopup(panel,{maxWidth:290,maxHeight:260}).openPopup();}});
          }else{
            const e=(feature.properties as PointProperties).establishment;
            marker=L.marker([lat,lon],{title:e.name+(e.abroad?' · '+countryName(e):''),icon:L.divIcon({className:'school-pin'+(e.abroad?' abroad-pin':e.uncertain?' uncertain-pin':''),html:e.abroad?globe:'<span></span>',iconSize:e.abroad?[28,28]:[20,20],iconAnchor:e.abroad?[14,14]:[10,10]})}).bindPopup(()=>establishmentNode(e),{maxWidth:290});
          }
          marker.addTo(layer);markers.set(key,marker);
        }
      });
      for(const [key,marker] of markers)if(!visible.has(key)){layer.removeLayer(marker);markers.delete(key);}
    }
    function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});}
    draw();map.on('move moveend zoomend',schedule);
    return()=>{cancelAnimationFrame(frame);map.off('move moveend zoomend',schedule);layer.remove();};
  },[mapped,indexes,language]);

  function countryView(group:typeof foreignGroups[number]){
    setActiveCountry(group.key);const country=geography?.countries?.features.find(f=>f.properties.code===group.key);
    const bounds=country?L.geoJSON(country).getBounds():L.latLngBounds(group.sites.map(e=>[e.lat,e.lon] as L.LatLngTuple));
    mapRef.current?.fitBounds(bounds,{padding:[35,35],maxZoom:7,animate:false});
  }
  function franceView(){setActiveCountry('');if(region)callbacks.current.onRegion('');else mapRef.current?.setView([46.6,2.4],5,{animate:false});}
  async function locate(){
    setLocationMessage('');if(!navigator.geolocation){setLocationMessage(tr('La localisation n’est pas disponible sur cet appareil.','Location is unavailable on this device.'));return;}
    const request=++locationRequest.current;setLocating(true);
    navigator.geolocation.getCurrentPosition(async position=>{
      if(request!==locationRequest.current)return;const {latitude:lat,longitude:lon,accuracy}=position.coords;
      try{const boundaries=await loadBoundaries();if(request!==locationRequest.current)return;const found=regionAt(boundaries.regions,lat,lon);if(found){if(found!==region)pendingLocation.current={lat,lon,region:found};callbacks.current.onRegion(found);}}catch{}
      if(request!==locationRequest.current)return;locationRef.current?.clearLayers();L.circle([lat,lon],{radius:accuracy,color:'#9b481c',fillOpacity:0.08,weight:1,interactive:false}).addTo(locationRef.current!);L.circleMarker([lat,lon],{radius:7,color:'#fdfbf9',weight:2,fillColor:'#9b481c',fillOpacity:1,interactive:false}).addTo(locationRef.current!);mapRef.current?.setView([lat,lon],11,{animate:false});setActiveCountry('');setLocating(false);setLocationMessage(tr('Votre position reste sur cet appareil. Elle n’est pas enregistrée.','Your position stays on this device and is not saved.'));
    },error=>{if(request!==locationRequest.current)return;setLocating(false);setLocationMessage(error.code===1?tr('Localisation refusée. Choisissez une région dans le filtre.','Location permission was denied. Choose a region in the filter.'):tr('Position introuvable. Réessayez ou choisissez une région.','Location could not be found. Try again or choose a region.'));},{enableHighAccuracy:false,maximumAge:300_000,timeout:12_000});
  }
  return <section className="france-map-section" aria-label={tr('Carte des établissements','Map of establishments')}>
    <div className="map-heading"><div><h2>{tr('Une piste, près de vous.','Find your place.')}</h2><p>{tr('Explorez les régions, zoomez sur les départements ou découvrez les campus à l’étranger.','Explore regions, zoom into departments or discover campuses abroad.')}</p></div><button type="button" className="button" disabled={locating} onClick={()=>void locate()}><Icon name="locate"/>{locating?tr('Localisation…','Locating…'):tr('Me localiser','Locate me')}</button></div>
    <div className="map-frame"><div className="france-map" ref={container} role="region" aria-label={tr('Carte interactive : flèches pour déplacer, touches + et − pour zoomer.','Interactive map: arrow keys to pan, + and − keys to zoom.')}/>{activeCountry&&foreignGroups.find(g=>g.key===activeCountry)&&<div className="map-country-context"><Icon name="globe"/>{countryName(foreignGroups.find(g=>g.key===activeCountry)!.sample)}</div>}{detailed&&!activeCountry&&<div className="department-key" aria-hidden="true">{departmentPalette.map(color=><i key={color} style={{background:color}}/>)}<span>{tr('Départements','Departments')}</span></div>}</div>
    <div className="map-bottom"><span><i className="map-legend-dot"/>{tr('Sites en France','Sites in France')}</span>{foreignGroups.length>0&&<span><i className="map-legend-abroad"/>{tr('Campus à l’étranger','Campuses abroad')}</span>}{uncertainCount>0&&<span><i className="map-legend-uncertain"/>{tr('Autres positions publiées','Other published positions')}</span>}{data&&<span>{formatNumber(data.establishments.length)} {tr('sites géolocalisés','geolocated sites')}</span>}<button type="button" className="text-link" onClick={franceView}>{tr('Vue France','France view')}</button></div>
    {foreignGroups.length>0&&<div className="abroad-destinations"><div><Icon name="globe"/><span>{tr('Aussi à l’étranger','Also abroad')}<small>{tr('Les campus du catalogue, dans leur pays.','Catalogue campuses, shown in their country.')}</small></span></div><div className="country-shortcuts">{foreignGroups.map(group=><button key={group.key} type="button" aria-pressed={activeCountry===group.key} onClick={()=>countryView(group)}>{countryName(group.sample)}<span>{group.sites.length}</span><Icon name="arrow"/></button>)}</div></div>}
    <div aria-live="polite">{data&&<p className="map-message map-source"><a href={data.source.url} target="_blank" rel="noopener noreferrer">{tr('Catalogue officiel','Official catalogue')} {data.year}</a> · {tr('Récupéré le','Retrieved on')} {formatDate(data.source.fetchedAt,{day:'numeric',month:'short',year:'numeric'})}{data.source.stale&&tr(' · source indisponible, dernière copie affichée',' · source unavailable, showing the last copy')}</p>}{loading&&<p className="map-message">{tr('Chargement des établissements…','Loading establishments…')}</p>}{error&&<p className="map-message">{error} <button className="text-link" onClick={()=>setRetry(v=>v+1)}>{tr('Réessayer','Try again')}</button></p>}{boundariesError&&<p className="map-message">{tr('Les contours n’ont pas pu être chargés.','Boundaries could not be loaded.')} <button className="text-link" onClick={()=>setRetry(v=>v+1)}>{tr('Réessayer','Try again')}</button></p>}{geography&&!geography.countries&&<p className="map-message">{tr('Les contours des pays sont indisponibles.','Country outlines are unavailable.')} <button className="text-link" onClick={()=>setRetry(v=>v+1)}>{tr('Réessayer','Try again')}</button></p>}{data&&!data.establishments.length&&<p className="map-message">{tr('Aucun établissement géolocalisé pour cette recherche.','No geolocated establishments for this search.')}</p>}{data&&data.unmapped>0&&<p className="map-message">{formatNumber(data.unmapped)} {tr('formation(s) sans coordonnées publiées restent accessibles dans la liste.','programme(s) without published coordinates remain accessible in the list.')}</p>}{locationMessage&&<p className="map-message">{locationMessage}</p>}</div>
  </section>;
}
