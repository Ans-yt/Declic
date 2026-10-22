import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import type { CatalogueFilters, CataloguePage, Establishment, EstablishmentMap, Formation, FormationDetail, PublicSource } from '../shared/catalogue.js';

const HOST = 'https://data.enseignementsup-recherche.gouv.fr';
const CATALOGUE = 'fr-esr-cartographie_formations_parcoursup';
const HISTORY = 'fr-esr-parcoursup';
const record = z.record(z.string(), z.unknown());
const envelope = z.object({ total_count: z.number().nonnegative(), results: z.array(record) });
const quote = (value: string) => JSON.stringify(value);
const str = (v: unknown) => typeof v === 'string' ? v : '';
const arr = (v: unknown) => Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
const number = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? v : null;
export class PublicDataError extends Error { status = 503; constructor(message = 'Les données officielles sont momentanément indisponibles. Réessayez dans un instant.') { super(message); } }
export function safeUrl(value: unknown, official = false): string | null {
  try { const url = new URL(str(value)); if (!['https:', 'http:'].includes(url.protocol)) return null; if (official && !(url.protocol === 'https:' && ['dossierappel.parcoursup.fr', 'dossier.parcoursup.fr', 'www.parcoursup.gouv.fr', 'parcoursup.gouv.fr'].includes(url.hostname))) return null; return url.href; } catch { return null; }
}
export function normalizeFormation(r: Record<string, unknown>): Formation {
  const year = Number(r.annee), code = str(r.gta);
  if (!Number.isInteger(year) || !/^\d+$/.test(code) || !str(r.etab_uai) || !arr(r.nm).length) throw new PublicDataError();
  const gps = typeof r.etab_gps === 'object' && r.etab_gps ? r.etab_gps as Record<string, unknown> : {};
  const lat = number(gps.lat), lon = number(gps.lon);
  const apprenticeshipStatus = arr(r.app).includes('Formations en apprentissage') ? 'yes' : null;
  return { id: `${year}:${code}`, year, code, institutionCode: str(r.etab_uai), name: arr(r.nm).join(' / '), institution: str(r.etab_nom), types: arr(r.tf), fields: arr(r.fl), city: str(r.commune), region: str(r.region), department: str(r.departement), sector: str(r.tc), apprenticeship: arr(r.app).some(v => /^Formations en apprentissage$/i.test(v.trim())), apprenticeshipStatus, attendance: arr(r.amg), officialUrl: safeUrl(r.fiche, true), website: safeUrl(r.etab_url), coordinates: lat !== null && lon !== null ? { lat, lon } : null };
}
type Cached<T> = { body: T; fetchedAt: string; stale: boolean };
export function createCatalogue(db: DatabaseSync, fetcher: typeof fetch = fetch) {
  db.exec('CREATE TABLE IF NOT EXISTS public_cache (key TEXT PRIMARY KEY, body TEXT NOT NULL, fetched_at TEXT NOT NULL)');
  const pending = new Map<string, Promise<Cached<unknown>>>();
  async function cached<T>(url: string, ttl = 900_000): Promise<Cached<T>> {
    const existing = db.prepare('SELECT body,fetched_at FROM public_cache WHERE key=?').get(url) as { body: string; fetched_at: string } | undefined;
    if (existing && Date.now() - Date.parse(existing.fetched_at) < ttl) return { body: JSON.parse(existing.body), fetchedAt: existing.fetched_at, stale: false };
    if (pending.has(url)) return pending.get(url)! as Promise<Cached<T>>;
    const promise = (async () => {
      try {
        const response = await fetcher(url, { signal: AbortSignal.timeout(url.includes('/exports/') ? 30_000 : 10_000), headers: { Accept: 'application/json' } });
        if (!response.ok) throw new PublicDataError();
        const body: unknown = await response.json();
        if (url.includes('/records?')) envelope.parse(body);
        if (url.includes('/exports/json?')) z.array(record).max(100_000).parse(body);
        const fetchedAt = new Date().toISOString();
        db.prepare('INSERT INTO public_cache (key,body,fetched_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET body=excluded.body,fetched_at=excluded.fetched_at').run(url, JSON.stringify(body), fetchedAt);
        db.exec('DELETE FROM public_cache WHERE key NOT IN (SELECT key FROM public_cache ORDER BY fetched_at DESC LIMIT 500)');
        // Broad map searches can be larger than record pages. Bound their total disk footprint too.
        db.exec('DELETE FROM public_cache WHERE key IN (SELECT key FROM (SELECT key,SUM(length(body)) OVER (ORDER BY fetched_at DESC,key) AS cumulative FROM public_cache) WHERE cumulative>80000000)');
        return { body, fetchedAt, stale: false };
      } catch {
        if (existing && Date.now() - Date.parse(existing.fetched_at) < 14 * 86400_000) return { body: JSON.parse(existing.body), fetchedAt: existing.fetched_at, stale: true };
        throw new PublicDataError();
      } finally { pending.delete(url); }
    })();
    pending.set(url, promise);
    return promise as Promise<Cached<T>>;
  }
  function endpoint(dataset: string, params?: Record<string, string>) { return `${HOST}/api/explore/v2.1/catalog/datasets/${dataset}` + (params ? '/records?' + new URLSearchParams(params) : ''); }
  async function latest(dataset: string, field: string) { const result = await cached<z.infer<typeof envelope>>(endpoint(dataset, { select: field, group_by: field, order_by: field + ' desc', limit: '1' }), 3600_000); const year = Number(result.body.results[0]?.[field]); if (!Number.isInteger(year) || year < 2020 || year > 2100) throw new PublicDataError(); return year; }
  async function source(dataset: string, result: Cached<unknown>): Promise<PublicSource> {
    let dataUpdatedAt: string | null = null;
    try { const metadata = await cached<{ metas?: { default?: { data_processed?: string } } }>(endpoint(dataset), 3600_000); dataUpdatedAt = metadata.body.metas?.default?.data_processed || null; } catch { /* Records retain their retrieval time when metadata is unavailable. */ }
    return { url: `${HOST}/explore/dataset/${dataset}/`, dataset, publisher: 'Ministère de l’Enseignement supérieur', license: 'Licence Ouverte 2.0 — Etalab', fetchedAt: result.fetchedAt, dataUpdatedAt, stale: result.stale };
  }
  return {
    async list(query: string, page: number, filters: CatalogueFilters = {}): Promise<CataloguePage> {
      const year = await latest(CATALOGUE, 'annee');
      const words = query.trim();
      const where = conditions(year, words, filters);
      const result = await cached<z.infer<typeof envelope>>(endpoint(CATALOGUE, { where, order_by: 'etab_nom,gta', limit: '24', offset: String((page - 1) * 24) }));
      return { results: result.body.results.map(normalizeFormation), total: result.body.total_count, page, pageSize: 24, year, source: await source(CATALOGUE, result) };
    },
    async map(query: string, filters: CatalogueFilters = {}): Promise<EstablishmentMap> {
      const year = await latest(CATALOGUE, 'annee');
      // A compact export avoids the records endpoint's 10,000-row ceiling. Only public map fields are requested.
      const url = `${endpoint(CATALOGUE)}/exports/json?` + new URLSearchParams({ select: 'etab_uai,etab_nom,commune,region,etab_gps', where: conditions(year, query.trim(), filters), limit: '-1' });
      const result = await cached<unknown>(url, 3600_000);
      const rows = z.array(record).max(100_000).parse(result.body);
      const points = new Map<string, Establishment>(); let unmapped = 0;
      for (const r of rows) {
        const gps = r.etab_gps as { lat?: number; lon?: number } | null;
        if (!gps || !Number.isFinite(gps.lat) || !Number.isFinite(gps.lon) || Math.abs(gps.lat!) > 90 || Math.abs(gps.lon!) > 180 || !str(r.etab_uai)) { unmapped++; continue; }
        const key = `${str(r.etab_uai)}:${str(r.commune)}:${str(r.region)}`;
        const point = points.get(key);
        if (point) point.courses++;
        else points.set(key, { id: key, code: str(r.etab_uai), name: str(r.etab_nom), city: str(r.commune), region: str(r.region), lat: gps.lat!, lon: gps.lon!, courses: 1 });
      }
      return { establishments: [...points.values()], year, courses: rows.length, unmapped, source: await source(CATALOGUE, result) };
    },
    async detail(id: string, withHistory = true): Promise<FormationDetail | null> {
      const [year, code] = id.split(':');
      const result = await cached<z.infer<typeof envelope>>(endpoint(CATALOGUE, { where: `annee=${quote(year)} AND gta=${quote(code)}`, limit: '2' }));
      if (!result.body.results.length) return null;
      // Ambiguous IDs must never combine unrelated records.
      if (result.body.results.length !== 1) throw new PublicDataError();
      const formation = normalizeFormation(result.body.results[0]);
      let history: FormationDetail['history'] = null, historyUnavailable = false;
      try { if (withHistory) {
        const session = await latest(HISTORY, 'session');
        if (session <= formation.year) {
          const historic = await cached<z.infer<typeof envelope>>(endpoint(HISTORY, { where: `session=${quote(String(session))} AND cod_aff_form=${quote(code)} AND cod_uai=${quote(formation.institutionCode)}`, limit: '2' }));
          if (historic.body.results.length === 1) { const h = historic.body.results[0]; if (String(h.session) === String(session) && str(h.cod_aff_form) === code && str(h.cod_uai) === formation.institutionCode) history = { year: session, capacity: number(h.capa_fin), applicants: number(h.voe_tot), offers: number(h.prop_tot), enrolled: number(h.acc_tot), accessRate: number(h.taux_acces_ens), selection: str(h.select_form) || null, source: await source(HISTORY, historic) }; }
        }
      } } catch { historyUnavailable = true; }
      return { formation, source: await source(CATALOGUE, result), history, historyUnavailable };
    }
  };
}
export function conditions(year: number, words: string, filters: CatalogueFilters) {
  const parts = [`annee=${quote(String(year))}`];
  if (words) parts.push(`(search(nm, ${quote(words)}) OR search(etab_nom, ${quote(words)}) OR search(commune, ${quote(words)}) OR search(region, ${quote(words)}))`);
  if (filters.region) parts.push(`region=${quote(filters.region)}`);
  if (filters.institution) parts.push(`etab_uai=${quote(filters.institution)}`);
  if (filters.type) parts.push(`search(tf, ${quote(filters.type)})`);
  if (filters.sector === 'public') parts.push('tc="Publics"');
  if (filters.sector === 'private') parts.push('(tc="Privés" OR tc="Privés en contrat avec l’Etat / EESC")');
  if (filters.apprenticeship === 'yes') parts.push('app="Formations en apprentissage"');
  // Missing apprenticeship data is unknown, never a negative answer.
  if (filters.apprenticeship === 'no') parts.push('(app IS NOT NULL AND app!="Formations en apprentissage")');
  return parts.join(' AND ');
}
