import type { FeatureCollection, Geometry, Position } from 'geojson';
export type BoundaryProperties = { code: string; nom: string; region?: string };
export type Boundaries = FeatureCollection<Geometry, BoundaryProperties>;
export const regions = ["Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Bretagne", "Centre-Val de Loire", "Corse", "Grand Est", "Guadeloupe", "Guyane", "Hauts-de-France", "La Réunion", "Martinique", "Mayotte", "Normandie", "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Polynésie française", "Provence-Alpes-Côte d'Azur", "Saint-Martin", "Île-de-France"];
function insideRing(lon: number, lat: number, ring: Position[]) { let inside = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside; } return inside; }
export function regionAt(boundaries: Boundaries, lat: number, lon: number): string | null {
  for (const feature of boundaries.features) {
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [];
    if (polygons.some(rings => insideRing(lon, lat, rings[0]) && !rings.slice(1).some(hole => insideRing(lon, lat, hole)))) return feature.properties.nom;
  }
  return null;
}
let cachedBoundaries: Promise<{ regions: Boundaries; departments: Boundaries }> | null = null;
export function loadBoundaries() {
  return cachedBoundaries ||= Promise.all(['regions','departements'].map(async name => { const response = await fetch(`/assets/geography/${name}.geojson`); if (!response.ok) throw new Error('boundaries'); const data = await response.json() as Boundaries; if (data.type !== 'FeatureCollection') throw new Error('boundaries'); return data; })).then(([regions, departments]) => ({ regions, departments })).catch(e => { cachedBoundaries = null; throw e; });
}
