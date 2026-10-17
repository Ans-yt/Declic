export type Formation = {
  id: string; year: number; code: string; institutionCode: string;
  name: string; institution: string; types: string[]; fields: string[];
  city: string; region: string; department: string; sector: string;
  apprenticeship: boolean; attendance: string[]; officialUrl: string | null;
  website: string | null; coordinates: { lat: number; lon: number } | null;
};
export type PublicSource = { url: string; dataset: string; publisher: string; license: string; fetchedAt: string; dataUpdatedAt: string | null; stale: boolean };
export type CataloguePage = { results: Formation[]; total: number; page: number; pageSize: number; year: number; source: PublicSource };
export type AdmissionHistory = { year: number; capacity: number | null; applicants: number | null; offers: number | null; enrolled: number | null; accessRate: number | null; selection: string | null; source: PublicSource };
export type FormationDetail = { formation: Formation; source: PublicSource; history: AdmissionHistory | null; historyUnavailable: boolean };
