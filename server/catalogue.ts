import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import type { CataloguePage, Formation, FormationDetail, PublicSource } from '../shared/catalogue.js';

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
  return { id: `${year}:${code}`, year, code, institutionCode: str(r.etab_uai), name: arr(r.nm).join(' / '), institution: str(r.etab_nom), types: arr(r.tf), fields: arr(r.fl), city: str(r.commune), region: str(r.region), department: str(r.departement), sector: str(r.tc), apprenticeship: arr(r.app).some(v => /apprentissage/i.test(v)), attendance: arr(r.amg), officialUrl: safeUrl(r.fiche, true), website: safeUrl(r.etab_url), coordinates: lat !== null && lon !== null ? { lat, lon } : null };
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
        const response = await fetcher(url, { signal: AbortSignal.timeout(10_000), headers: { Accept: 'application/json' } });
        if (!response.ok) throw new PublicDataError();
        const body: unknown = await response.json();
        if (url.includes('/records?')) envelope.parse(body);
        const fetchedAt = new Date().toISOString();
        db.prepare('INSERT INTO public_cache (key,body,fetched_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET body=excluded.body,fetched_at=excluded.fetched_at').run(url, JSON.stringify(body), fetchedAt);
        db.exec('DELETE FROM public_cache WHERE key NOT IN (SELECT key FROM public_cache ORDER BY fetched_at DESC LIMIT 500)');
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
    async list(query: string, page: number): Promise<CataloguePage> {
      const year = await latest(CATALOGUE, 'annee');
      const words = query.trim();
      const where = `annee=${quote(String(year))}` + (words ? ` AND (search(nm, ${quote(words)}) OR search(etab_nom, ${quote(words)}) OR search(commune, ${quote(words)}) OR search(region, ${quote(words)}))` : '');
      const result = await cached<z.infer<typeof envelope>>(endpoint(CATALOGUE, { where, order_by: 'etab_nom,gta', limit: '24', offset: String((page - 1) * 24) }));
      return { results: result.body.results.map(normalizeFormation), total: result.body.total_count, page, pageSize: 24, year, source: await source(CATALOGUE, result) };
    },
    async detail(id: string): Promise<FormationDetail | null> {
      const [year, code] = id.split(':');
      const result = await cached<z.infer<typeof envelope>>(endpoint(CATALOGUE, { where: `annee=${quote(year)} AND gta=${quote(code)}`, limit: '2' }));
      if (!result.body.results.length) return null;
      // Ambiguous IDs must never combine unrelated records.
      if (result.body.results.length !== 1) throw new PublicDataError();
      const formation = normalizeFormation(result.body.results[0]);
      let history: FormationDetail['history'] = null, historyUnavailable = false;
      try {
        const session = await latest(HISTORY, 'session');
        if (session <= formation.year) {
          const historic = await cached<z.infer<typeof envelope>>(endpoint(HISTORY, { where: `session=${quote(String(session))} AND cod_aff_form=${quote(code)} AND cod_uai=${quote(formation.institutionCode)}`, limit: '2' }));
          if (historic.body.results.length === 1) { const h = historic.body.results[0]; history = { year: session, capacity: number(h.capa_fin), applicants: number(h.voe_tot), offers: number(h.prop_tot), enrolled: number(h.acc_tot), accessRate: number(h.taux_acces_ens), selection: str(h.select_form) || null, source: await source(HISTORY, historic) }; }
        }
      } catch { historyUnavailable = true; }
      return { formation, source: await source(CATALOGUE, result), history, historyUnavailable };
    }
  };
}
