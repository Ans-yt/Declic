import express, { type ErrorRequestHandler } from 'express';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { createCatalogue, PublicDataError } from './catalogue.js';
import { applicationSchema, blankCV, blankProfile, candidateSchema, cvSchema, hoursSchema, needSchema, profileSchema, reviewSchema, type Application, type Candidate, type Need, type Workspace } from '../shared/models.js';

class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
const normal = (v: string) => v.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));

export function createApp(dbPath: string, options: { fetcher?: typeof fetch } = {}) {
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS candidates (id TEXT PRIMARY KEY, body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS needs (id TEXT PRIMARY KEY, body TEXT NOT NULL);
    PRAGMA user_version=1;`);
  const catalogue = createCatalogue(db, options.fetcher);
  type Table = 'applications' | 'candidates' | 'needs';
  function list<T>(table: Table): T[] { return (db.prepare(`SELECT body FROM ${table} ORDER BY rowid DESC`).all() as { body: string }[]).map(r => JSON.parse(r.body) as T); }
  function get<T>(table: Table, id: string): T { const row = db.prepare(`SELECT body FROM ${table} WHERE id=?`).get(id) as { body: string } | undefined; if (!row) throw new HttpError(404, 'Cet élément est introuvable.'); return JSON.parse(row.body) as T; }
  function put(table: Table, entity: { id: string }) { db.prepare(`INSERT INTO ${table} (id,body) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body`).run(entity.id, JSON.stringify(entity)); }
  function setting<T>(key: string, fallback: T): T { const row = db.prepare('SELECT body FROM settings WHERE key=?').get(key) as { body: string } | undefined; return row ? JSON.parse(row.body) as T : fallback; }
  function set(key: string, value: unknown) { db.prepare('INSERT INTO settings (key,body) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET body=excluded.body').run(key, JSON.stringify(value)); }
  function workspace(): Workspace { return { profile: setting('profile', blankProfile), cv: setting('cv', blankCV), saved: setting<unknown[]>('saved', []).filter((id): id is string => typeof id === 'string' && /^\d{4}:\d+$/.test(id)), applications: list('applications'), candidates: list('candidates'), needs: list('needs') }; }
  function compatible(need: Need, candidate: Candidate) {
    return candidate.verified && normal(candidate.subject) === normal(need.subject) && normal(candidate.city) === normal(need.city) && candidate.date === need.date && candidate.start <= need.start && candidate.end >= need.end && !list<Need>('needs').some(n => n.id !== need.id && n.candidateId === candidate.id && ['confirmed', 'completed'].includes(n.status) && n.date === need.date && n.start < need.end && n.end > need.start);
  }
  const app = express(); app.disable('x-powered-by');
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
    // The prototype is intentionally local and shared. Do not expose it as a multi-user service.
    const allowedHosts = ['127.0.0.1', 'localhost', '[::1]'];
    if (!allowedHosts.includes(req.hostname)) return res.status(403).json({ error: 'Cette démonstration est accessible uniquement en local.' });
    if (req.headers.origin && req.headers.origin !== `${req.protocol}://${req.headers.host}`) return res.status(403).json({ error: 'Origine de la requête non autorisée.' });
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !req.is('application/json')) return res.status(415).json({ error: 'Le format JSON est nécessaire.' });
    next();
  });
  app.use(express.json({ limit: '256kb' }));
  app.get('/api/health', (_req, res) => res.json({ ok: true, storage: 'sqlite', mode: 'local-demo' }));
  app.get('/api/catalogue', async (req,res) => { const input = z.object({ q: z.string().max(100).default(''), page: z.coerce.number().int().min(1).max(416).default(1) }).parse(req.query); res.json(await catalogue.list(input.q, input.page)); });
  app.get('/api/catalogue/:id', async (req,res) => { const id = z.string().regex(/^\d{4}:\d+$/).parse(req.params.id); const detail = await catalogue.detail(id); if (!detail) throw new HttpError(404, 'Formation introuvable dans le catalogue officiel.'); res.json(detail); });
  app.get('/api/workspace', (_req, res) => res.json(workspace()));
  app.put('/api/profile', (req, res) => { set('profile', profileSchema.parse(req.body)); res.json(workspace()); });
  app.put('/api/cv', (req, res) => { set('cv', cvSchema.parse(req.body)); res.json(workspace()); });
  app.put('/api/saved', (req, res) => { set('saved', z.array(z.string().regex(/^\d{4}:\d+$/)).max(100).parse(req.body)); res.json(workspace()); });
  app.post('/api/applications', (req, res) => {
    const input = applicationSchema.parse(req.body);
    if (list<Application>('applications').some(a => normal(a.reference) === normal(input.reference))) throw new HttpError(409, 'Cette référence existe déjà. Choisissez une référence unique.');
    const now = new Date().toISOString(); put('applications', { ...input, id: randomUUID(), status: 'pending', review: null, questions: [], createdAt: now, updatedAt: now } as Application); res.status(201).json(workspace());
  });
  app.put('/api/applications/:id/review', (req, res) => { const a = get<Application>('applications', req.params.id); if (a.status === 'published') throw new HttpError(409, 'Une évaluation partagée ne peut plus être modifiée.'); a.review = reviewSchema.parse(req.body); a.status = 'reviewed'; a.updatedAt = new Date().toISOString(); put('applications', a); res.json(workspace()); });
  app.post('/api/applications/:id/publish', (req, res) => { const a = get<Application>('applications', req.params.id); if (a.status !== 'reviewed' || !a.review) throw new HttpError(409, 'Enregistrez une évaluation complète avant de partager la réponse.'); a.status = 'published'; a.updatedAt = new Date().toISOString(); put('applications', a); res.json(workspace()); });
  app.post('/api/applications/:id/questions', (req, res) => { const a = get<Application>('applications', req.params.id); if (a.status !== 'published') throw new HttpError(409, 'La décision n’a pas encore été partagée.'); const input = z.object({ text: z.string().trim().min(1).max(3000) }).parse(req.body); if (a.questions.length >= 30) throw new HttpError(409, 'Le maximum de demandes pour ce dossier est atteint.'); a.questions.push({ id: randomUUID(), text: input.text, answer: '', createdAt: new Date().toISOString() }); a.updatedAt = new Date().toISOString(); put('applications', a); res.status(201).json(workspace()); });
  app.put('/api/applications/:id/questions/:questionId', (req, res) => { const a = get<Application>('applications', req.params.id); const q = a.questions.find(q => q.id === req.params.questionId); if (!q) throw new HttpError(404, 'Demande introuvable.'); if (q.answer) throw new HttpError(409, 'Une réponse a déjà été enregistrée.'); q.answer = z.object({ answer: z.string().trim().min(1).max(3000) }).parse(req.body).answer; a.updatedAt = new Date().toISOString(); put('applications', a); res.json(workspace()); });
  app.post('/api/needs', (req, res) => { put('needs', { ...needSchema.parse(req.body), id: randomUUID(), status: 'open', candidateId: null, hours: null, createdAt: new Date().toISOString() } as Need); res.status(201).json(workspace()); });
  app.post('/api/candidates', (req, res) => { put('candidates', { ...candidateSchema.parse(req.body), id: randomUUID(), verified: false } as Candidate); res.status(201).json(workspace()); });
  app.post('/api/candidates/:id/verify', (req, res) => { const c = get<Candidate>('candidates', req.params.id); c.verified = true; put('candidates', c); res.json(workspace()); });
  app.get('/api/needs/:id/matches', (req, res) => { const n = get<Need>('needs', req.params.id); res.json({ candidates: n.status === 'open' ? list<Candidate>('candidates').filter(c => compatible(n, c)) : [] }); });
  app.post('/api/needs/:id/assign', (req, res) => { const n = get<Need>('needs', req.params.id); if (n.status !== 'open') throw new HttpError(409, 'Cette mission n’est plus à pourvoir.'); const { candidateId } = z.object({ candidateId: z.uuid() }).parse(req.body); const c = get<Candidate>('candidates', candidateId); if (!compatible(n, c)) throw new HttpError(409, 'Ce profil n’est pas compatible ou son créneau est déjà occupé. Actualisez les disponibilités.'); n.status = 'confirmed'; n.candidateId = c.id; put('needs', n); res.json(workspace()); });
  app.post('/api/needs/:id/cancel', (req, res) => { const n = get<Need>('needs', req.params.id); if (!['open', 'confirmed'].includes(n.status)) throw new HttpError(409, 'Cette mission ne peut plus être annulée.'); n.status = 'cancelled'; put('needs', n); res.json(workspace()); });
  app.post('/api/needs/:id/hours', (req, res) => { const n = get<Need>('needs', req.params.id); if (n.status !== 'confirmed') throw new HttpError(409, 'Confirmez une mission avant de valider ses heures.'); const { hours } = hoursSchema.parse(req.body); if (hours > (minutes(n.end) - minutes(n.start)) / 60) throw new HttpError(400, 'Les heures dépassent la durée prévue de la mission.'); if (new Date(`${n.date}T${n.end}:00`) > new Date()) throw new HttpError(409, 'Attendez la fin de la mission pour valider les heures effectuées.'); n.hours = hours; n.status = 'completed'; put('needs', n); res.json(workspace()); });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Cette route API n’existe pas.' }));
  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Vérifiez les champs : ' + error.issues.map(i => `${i.path.join('.')} — ${i.message}`).join(' ; ') }); return; }
    if (error instanceof PublicDataError) { res.status(error.status).json({ error: error.message }); return; }
    if (error instanceof HttpError) { res.status(error.status).json({ error: error.message }); return; }
    if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') { res.status(400).json({ error: 'Le contenu envoyé est invalide ou trop volumineux.' }); return; }
    console.error(error); res.status(500).json({ error: 'L’enregistrement a échoué. Réessayez sans quitter votre saisie.' });
  };
  app.use(errorHandler);
  return { app, close: () => db.close() };
}
