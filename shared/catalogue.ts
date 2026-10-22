export type Formation = {
  id: string; year: number; code: string; institutionCode: string;
  name: string; institution: string; types: string[]; fields: string[];
  city: string; region: string; department: string; sector: string;
  apprenticeship: boolean; apprenticeshipStatus?: 'yes' | 'no' | null; attendance: string[]; officialUrl: string | null;
  website: string | null; coordinates: { lat: number; lon: number } | null;
};
export type PublicSource = { url: string; dataset: string; publisher: string; license: string; fetchedAt: string; dataUpdatedAt: string | null; stale: boolean };
export type CataloguePage = { results: Formation[]; total: number; page: number; pageSize: number; year: number; source: PublicSource };
export type AdmissionHistory = { year: number; capacity: number | null; applicants: number | null; offers: number | null; enrolled: number | null; accessRate: number | null; selection: string | null; source: PublicSource };
export type FormationDetail = { formation: Formation; source: PublicSource; history: AdmissionHistory | null; historyUnavailable: boolean };
export type CatalogueFilters = { region?: string; institution?: string; type?: string; sector?: '' | 'public' | 'private'; apprenticeship?: '' | 'yes' | 'no' };

export type CatalogueSearch = { q: string; region: string; institution: string; institutionName: string; page: number; view: 'list' | 'map'; saved: boolean; type: string; sector: '' | 'public' | 'private'; apprenticeship: '' | 'yes' | 'no' };
/** Hash parameters are shared by subject routes and ordinary searches. */
export function parseCatalogueSearch(hash: string, subjectQuery = ''): CatalogueSearch {
  const params = new URLSearchParams(hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '');
  const page = Number(params.get('page'));
  return { q: (params.get('q') ?? subjectQuery).slice(0, 100), region: (params.get('region') || '').slice(0, 100), institution: (params.get('institution') || '').slice(0, 100), institutionName: (params.get('institutionName') || '').slice(0, 300), page: Number.isInteger(page) && page >= 1 && page <= 416 ? page : 1, view: params.get('view') === 'map' ? 'map' : 'list', saved: params.get('saved') === '1', type: (params.get('type') || '').slice(0, 100), sector: params.get('sector') === 'public' ? 'public' : params.get('sector') === 'private' ? 'private' : '', apprenticeship: params.get('apprenticeship') === 'yes' ? 'yes' : params.get('apprenticeship') === 'no' ? 'no' : '' };
}
export function catalogueSearchHash(state: CatalogueSearch): string {
  const params = new URLSearchParams({ q: state.q, region: state.region, institution: state.institution, institutionName: state.institutionName, page: String(state.page), view: state.view, type: state.type, sector: state.sector, apprenticeship: state.apprenticeship });
  if (state.saved) params.set('saved', '1');
  for (const [key, value] of [...params]) if (!value) params.delete(key);
  return '#formations?' + params;
}
export type Establishment = { id: string; code: string; name: string; city: string; region: string; lat: number; lon: number; courses: number };
export type EstablishmentMap = { establishments: Establishment[]; year: number; courses: number; unmapped: number; source: PublicSource };
