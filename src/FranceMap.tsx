import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import Supercluster from 'supercluster';
import type { Feature, Point } from 'geojson';
import type { Establishment, EstablishmentMap } from '../shared/catalogue';
import { api } from './api';
import { getLanguage, formatNumber, formatDate, tr } from './i18n';
import { Icon } from './ui';
import { loadBoundaries, regionAt } from './geography';
import 'leaflet/dist/leaflet.css';

type PointProperties = { establishment: Establishment };
export default function FranceMap({ query, region, onRegion, onInstitution }: { query: string; region: string; onRegion: (v: string) => void; onInstitution: (v: Establishment) => void }) {
  const container = useRef<HTMLDivElement>(null), mapRef = useRef<L.Map | null>(null), locationRef = useRef<L.LayerGroup | null>(null);
  const [data, setData] = useState<EstablishmentMap | null>(null), [error, setError] = useState(''), [retry, setRetry] = useState(0), [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false), [locationMessage, setLocationMessage] = useState(''), [boundariesError, setBoundariesError] = useState(false), [zoom, setZoom] = useState(5);
  const language = getLanguage();
  const callbacks = useRef({ onRegion, onInstitution }); callbacks.current = { onRegion, onInstitution };
  const locationRequest = useRef(0);
  const pendingLocation = useRef<{ lat: number; lon: number; region: string } | null>(null);
  useEffect(() => {
    let active = true; const controller = new AbortController(); setLoading(true); setError(''); setData(null);
    api<EstablishmentMap>(`/catalogue/map?${new URLSearchParams({ q: query, region })}`, 'GET', undefined, controller.signal).then(result => { if (active) { setData(result); setLoading(false); } }).catch(() => { if (active) { setError(tr('La carte des établissements est indisponible. La recherche reste accessible ci-dessous.', 'The establishment map is unavailable. You can still search below.')); setLoading(false); } });
    return () => { active = false; controller.abort(); };
  }, [query, region, retry]);
  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current, { center: [46.6, 2.4], zoom: 5, minZoom: 2, maxZoom: 20, preferCanvas: true, zoomControl: false, scrollWheelZoom: false, worldCopyJump: true, zoomAnimation: !matchMedia('(prefers-reduced-motion: reduce)').matches });
    mapRef.current = map; map.attributionControl.setPrefix(false);
    map.attributionControl.addAttribution('<a href="https://github.com/datagouv/contours-administratifs" target="_blank" rel="noopener noreferrer">IGN / Etalab · 2025 · Licence Ouverte</a>');
    locationRef.current = L.layerGroup().addTo(map);
    map.on('zoomend', () => setZoom(map.getZoom()));
    const resize = new ResizeObserver(() => map.invalidateSize()); resize.observe(container.current);
    return () => { locationRequest.current++; resize.disconnect(); map.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => { const map = mapRef.current; if(!map) return; const control = L.control.zoom({ zoomInTitle: tr('Zoomer', 'Zoom in'), zoomOutTitle: tr('Dézoomer', 'Zoom out') }).addTo(map); return () => { control.remove(); }; }, [language]);
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    let active = true; const layer = L.layerGroup().addTo(map); setBoundariesError(false);
    loadBoundaries().then(boundaries => {
      if (!active) return;
      const detailed = map.getZoom() >= 7;
      if (detailed) L.geoJSON(boundaries.departments, { style: { color: '#9b8676', weight: 0.8, fillOpacity: 0, opacity: 0.75 }, onEachFeature(feature, shape) { const label = document.createElement('span'); label.textContent = feature.properties.nom; shape.bindTooltip(label, { sticky: true }); } }).addTo(layer);
      L.geoJSON(boundaries.regions, { style: feature => ({ color: '#594330', weight: detailed ? 1.7 : 1.2, fillColor: feature?.properties.nom === region ? '#e8be9a' : '#eee4d7', fillOpacity: detailed ? 0.16 : 0.6 }), onEachFeature(feature, shape) {
        const label = document.createElement('span'); label.textContent = feature.properties.nom; shape.bindTooltip(label, { sticky: true });
        shape.on('click', () => callbacks.current.onRegion(feature.properties.nom));
        if (!detailed && ['11','24','27','28','32','44','52','53','75','76','84','93','94'].includes(feature.properties.code)) {
          const bounds = (shape as L.Polygon).getBounds();
          const name = document.createElement('span'); name.textContent = feature.properties.nom;
          L.marker(bounds.getCenter(), { interactive: false, keyboard: false, zIndexOffset: -1000, icon: L.divIcon({ className: 'region-map-label', html: name, iconSize: [110, 28], iconAnchor: [55, 14] }) }).addTo(layer);
        }
      } }).addTo(layer);
    }).catch(() => { if (active) setBoundariesError(true); });
    return () => { active = false; layer.remove(); };
  }, [zoom >= 7, region, retry]);
  useEffect(() => {
    const map = mapRef.current; if (!map) return; let active = true;
    if (pendingLocation.current?.region === region) { const point = pendingLocation.current; pendingLocation.current = null; map.setView([point.lat,point.lon],11,{ animate:false }); return; }
    if (!region) { map.setView([46.6, 2.4], 5, { animate: false }); return; }
    loadBoundaries().then(boundaries => { if (!active) return; const feature = boundaries.regions.features.find(f => f.properties.nom === region); if (feature) { if (region === 'Polynésie française') map.setView([-17.7, -149.5], 5); else map.fitBounds(L.geoJSON(feature).getBounds(), { padding: [28, 28], maxZoom: 9, animate: false }); } }).catch(() => {});
    return () => { active = false; };
  }, [region]);
  useEffect(() => {
    const map = mapRef.current; if (!map || !data) return;
    const layer = L.layerGroup().addTo(map);
    const points: Feature<Point, PointProperties>[] = data.establishments.map(establishment => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [establishment.lon, establishment.lat] }, properties: { establishment } }));
    const index = new Supercluster<PointProperties>({ radius: 65, maxZoom: 20 }).load(points);
    function establishmentNode(e: Establishment) {
      const wrapper = document.createElement('div'), title = document.createElement('strong'), place = document.createElement('p'), button = document.createElement('button');
      title.textContent = e.name; place.textContent = `${e.city} · ${e.courses} ${tr('formation(s)', 'programme(s)')}`;
      button.type = 'button'; button.className = 'text-link'; button.textContent = tr('Voir les formations', 'View programmes'); button.onclick = () => callbacks.current.onInstitution(e);
      wrapper.append(title, place, button); return wrapper;
    }
    function draw() {
      layer.clearLayers(); const bounds = map!.getBounds();
      const features = index.getClusters([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], Math.floor(map!.getZoom()));
      for (const feature of features) {
        const [lon, lat] = feature.geometry.coordinates;
        if ('cluster' in feature.properties && feature.properties.cluster) {
          const { point_count: count, cluster_id: id } = feature.properties;
          const content = document.createElement('span'); content.textContent = formatNumber(count);
          const marker = L.marker([lat, lon], { title: `${count} ${tr('établissements : zoomer', 'establishments: zoom in')}`, icon: L.divIcon({ className: 'school-cluster', html: content, iconSize: [42, 42], iconAnchor: [21, 21] }) }).addTo(layer);
          marker.on('click', () => { if (map!.getZoom() < 20) map!.setView([lat, lon], Math.min(20, index.getClusterExpansionZoom(id)), { animate: false }); else { const panel = document.createElement('div'); panel.className = 'shared-campus'; index.getLeaves(id, count).forEach(leaf => panel.append(establishmentNode(leaf.properties.establishment))); marker.bindPopup(panel, { maxWidth: 290, maxHeight: 260 }).openPopup(); } });
        } else {
          const e = (feature.properties as PointProperties).establishment;
          L.marker([lat, lon], { title: e.name, icon: L.divIcon({ className: 'school-pin', html: '<span></span>', iconSize: [20, 20], iconAnchor: [10, 10] }) }).bindPopup(establishmentNode(e), { maxWidth: 290 }).addTo(layer);
        }
      }
    }
    draw(); map.on('moveend zoomend', draw);
    return () => { map.off('moveend zoomend', draw); layer.remove(); };
  }, [data, language]);
  async function locate() {
    setLocationMessage(''); if (!navigator.geolocation) { setLocationMessage(tr('La localisation n’est pas disponible sur cet appareil.', 'Location is unavailable on this device.')); return; }
    const request = ++locationRequest.current; setLocating(true);
    navigator.geolocation.getCurrentPosition(async position => {
      if (request !== locationRequest.current) return;
      const { latitude: lat, longitude: lon, accuracy } = position.coords;
      try { const boundaries = await loadBoundaries(); if (request !== locationRequest.current) return; const found = regionAt(boundaries.regions, lat, lon); if (found) { if(found !== region) pendingLocation.current = { lat, lon, region: found }; callbacks.current.onRegion(found); } } catch { /* Centering remains useful without boundary data. */ }
      if (request !== locationRequest.current) return;
      locationRef.current?.clearLayers(); L.circle([lat, lon], { radius: accuracy, color: '#9b481c', fillOpacity: 0.08, weight: 1 }).addTo(locationRef.current!);
      L.circleMarker([lat, lon], { radius: 7, color: '#fdfbf9', weight: 2, fillColor: '#9b481c', fillOpacity: 1 }).addTo(locationRef.current!);
      mapRef.current?.setView([lat, lon], 11, { animate: false }); setLocating(false);
      setLocationMessage(tr('Votre position reste sur cet appareil. Elle n’est pas enregistrée.', 'Your position stays on this device and is not saved.'));
    }, error => { if (request !== locationRequest.current) return; setLocating(false); setLocationMessage(error.code === 1 ? tr('Localisation refusée. Choisissez une région dans le filtre.', 'Location permission was denied. Choose a region in the filter.') : tr('Position introuvable. Réessayez ou choisissez une région.', 'Location could not be found. Try again or choose a region.')); }, { enableHighAccuracy: false, maximumAge: 300_000, timeout: 12_000 });
  }
  return <section className="france-map-section" aria-label={tr('Carte des établissements', 'Map of establishments')}><div className="map-heading"><div><h2>{tr('Une piste, près de vous.', 'Find your place.')}</h2><p>{tr('Cliquez sur une région. Zoomez pour découvrir les départements et les établissements.', 'Choose a region. Zoom in to discover departments and establishments.')}</p></div><button type="button" className="button" disabled={locating} onClick={() => void locate()}><Icon name="locate"/>{locating ? tr('Localisation…', 'Locating…') : tr('Me localiser', 'Locate me')}</button></div><div className="france-map" ref={container} role="region" aria-label={tr('Carte interactive : flèches pour déplacer, touches + et − pour zoomer.', 'Interactive map: arrow keys to pan, + and − keys to zoom.')}/><div className="map-bottom"><span><i className="map-legend-line"/>{zoom >= 7 ? tr('Régions & départements', 'Regions & departments') : tr('Régions', 'Regions')}</span>{data && <span><i className="map-legend-dot"/>{formatNumber(data.establishments.length)} {tr('sites d’établissements géolocalisés', 'geolocated establishment sites')}{data.source.stale && tr(' · copie en cache', ' · cached copy')}</span>}<button type="button" className="text-link" onClick={() => { if (region) callbacks.current.onRegion(''); else mapRef.current?.setView([46.6, 2.4],5); }}>{tr('Vue France', 'France view')}</button></div><div aria-live="polite">{data && <p className="map-message map-source"><a href={data.source.url} target="_blank" rel="noopener noreferrer">{tr('Catalogue officiel', 'Official catalogue')} {data.year}</a> · {tr('Récupéré le', 'Retrieved on')} {formatDate(data.source.fetchedAt, { day:'numeric',month:'short',year:'numeric' })}{data.source.stale && tr(' · source indisponible, dernière copie affichée', ' · source unavailable, showing the last copy')}</p>}{loading && <p className="map-message">{tr('Chargement des établissements…', 'Loading establishments…')}</p>}{error && <p className="map-message">{error} <button className="text-link" onClick={() => setRetry(v => v + 1)}>{tr('Réessayer', 'Try again')}</button></p>}{boundariesError && <p className="map-message">{tr('Les contours n’ont pas pu être chargés.', 'Boundaries could not be loaded.')} <button className="text-link" onClick={() => setRetry(v => v + 1)}>{tr('Réessayer', 'Try again')}</button></p>}{data && !data.establishments.length && <p className="map-message">{tr('Aucun établissement géolocalisé pour cette recherche.', 'No geolocated establishments for this search.')}</p>}{data && data.unmapped > 0 && <p className="map-message">{formatNumber(data.unmapped)} {tr('formation(s) sans coordonnées publiées restent accessibles dans la liste.', 'programme(s) without published coordinates remain accessible in the list.')}</p>}{locationMessage && <p className="map-message">{locationMessage}</p>}</div></section>;
}
