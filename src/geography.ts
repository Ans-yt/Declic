import type { Feature, FeatureCollection, Geometry, Position } from 'geojson';
import type { Establishment } from '../shared/catalogue';
export type BoundaryProperties = { code: string; nom: string; region?: string };
export type Boundaries = FeatureCollection<Geometry, BoundaryProperties>;
export type Countries = FeatureCollection<Geometry, BoundaryProperties & { name: string; label: [number,number] }>;
export const regions = ["Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Bretagne", "Centre-Val de Loire", "Corse", "Grand Est", "Guadeloupe", "Guyane", "Hauts-de-France", "La Réunion", "Martinique", "Mayotte", "Normandie", "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Polynésie française", "Provence-Alpes-Côte d'Azur", "Saint-Martin", "Île-de-France"];
function insideRing(lon: number, lat: number, ring: Position[]) { let inside = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside; } return inside; }
function polygons(geometry: Geometry) { return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : []; }
// Prepare bounds once; avoid running polygon hit tests on every shape for every campus.
export function spatialLookup<P>(collection: FeatureCollection<Geometry,P>) {
  const prepared = collection.features.flatMap(feature => polygons(feature.geometry).map(rings => {
    let west=Infinity,east=-Infinity,south=Infinity,north=-Infinity;
    for(const [lon,lat] of rings[0]){west=Math.min(west,lon);east=Math.max(east,lon);south=Math.min(south,lat);north=Math.max(north,lat);}
    return { feature,rings,west,east,south,north };
  }));
  return (lat: number,lon: number): Feature<Geometry,P> | null => {
    for(const shape of prepared) if(lon>=shape.west && lon<=shape.east && lat>=shape.south && lat<=shape.north && insideRing(lon,lat,shape.rings[0]) && !shape.rings.slice(1).some(h=>insideRing(lon,lat,h))) return shape.feature;
    return null;
  };
}
export function regionAt(boundaries: Boundaries, lat: number, lon: number): string | null {
  return spatialLookup(boundaries)(lat,lon)?.properties.nom || null;
}
let cachedBoundaries: Promise<{ regions: Boundaries; departments: Boundaries }> | null = null;
export function loadBoundaries() {
  return cachedBoundaries ||= Promise.all(['regions','departements'].map(async name => { const response = await fetch(`/assets/geography/${name}.geojson`); if (!response.ok) throw new Error('boundaries'); const data = await response.json() as Boundaries; if (data.type !== 'FeatureCollection') throw new Error('boundaries'); return data; })).then(([regions, departments]) => ({ regions, departments })).catch(e => { cachedBoundaries = null; throw e; });
}
let cachedCountries: Promise<Countries> | null = null;
export function loadCountries() { return cachedCountries ||= fetch('/assets/geography/countries.geojson').then(async response => { if(!response.ok) throw new Error('countries'); const data=await response.json() as Countries; if(data.type!=='FeatureCollection') throw new Error('countries'); return data; }).catch(e=>{cachedCountries=null;throw e;}); }
export type MappedEstablishment = Establishment & { abroad: boolean; uncertain: boolean; country: { code: string; fr: string; en: string } | null };
export function classifyEstablishments(establishments: Establishment[], regions: Boundaries, countries: Countries | null): MappedEstablishment[] {
  const inFrance=spatialLookup(regions), countryAt=countries ? spatialLookup(countries) : null;
  const frenchTerritories=new Set(['FR','GF','GP','MQ','RE','YT','NC','PF','WF','PM','BL','MF','TF']);
  return establishments.map(e=>{
    if(inFrance(e.lat,e.lon)) return {...e,abroad:false,uncertain:false,country:null};
    const country=countryAt?.(e.lat,e.lon)?.properties;
    return {...e,abroad:country ? !frenchTerritories.has(country.code) : false,uncertain:!country,country:country ? {code:country.code,fr:country.nom,en:country.name} : null};
  });
}
export const departmentPalette=['#e8c7ab','#c4d4c5','#c9d5e2','#e5dba9','#d9cadf','#c4dddc'];
export function departmentColourIndexes(boundaries: Boundaries): Record<string,number> {
  const neighbours=new Map(boundaries.features.map(f=>[f.properties.code,new Set<string>()]));
  const vertices=new Map<string,Set<string>>();
  for(const feature of boundaries.features) for(const polygon of polygons(feature.geometry)) for(const [lon,lat] of polygon[0]) {
    const key=lon.toFixed(3)+','+lat.toFixed(3);const owners=vertices.get(key)||new Set<string>();owners.add(feature.properties.code);vertices.set(key,owners);
  }
  for(const owners of vertices.values()) for(const a of owners) for(const b of owners) if(a!==b) neighbours.get(a)!.add(b);
  const colors:Record<string,number>={};
  const ordered=[...neighbours.keys()].sort((a,b)=>neighbours.get(b)!.size-neighbours.get(a)!.size || a.localeCompare(b));
  for(const code of ordered){const used=new Set([...neighbours.get(code)!].map(other=>colors[other]));let index=0;while(used.has(index))index++;colors[code]=index%departmentPalette.length;}
  return colors;
}
