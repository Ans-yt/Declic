import express, { type ErrorRequestHandler } from 'express';
import { openDatabase } from './storage.js';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { z } from 'zod';
import { createCatalogue, PublicDataError } from './catalogue.js';
import { installAuth, requireStaff, workspaceContext, workspaceId } from './auth.js';
import { readConfig, type AppConfig } from './config.js';
import { installAttachments } from './attachments.js';
import { applicationSchema, backupSchema, blankCV, blankPlanner, blankProfile, candidateSchema, cvSchema, hoursSchema, needSchema, plannerSchema, profileSchema, reviewSchema, savedSchema, type Application, type Candidate, type Need, type Workspace } from '../shared/models.js';

class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
const normal = (v: string) => v.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));

export function createApp(dbPath: string, options: { fetcher?: typeof fetch; config?: AppConfig } = {}) {
  const config = options.config || readConfig();
  const db = openDatabase(dbPath);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS candidates (id TEXT PRIMARY KEY, body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS needs (id TEXT PRIMARY KEY, body TEXT NOT NULL);
    PRAGMA user_version=1;`);
  db.exec('CREATE TABLE IF NOT EXISTS scoped_settings (workspace TEXT NOT NULL,key TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(workspace,key))');
  for (const table of ['applications','candidates','needs']) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!columns.some(c => c.name === 'workspace')) db.exec(`ALTER TABLE ${table} ADD COLUMN workspace TEXT NOT NULL DEFAULT 'legacy'`);
    db.exec(`CREATE INDEX IF NOT EXISTS ${table}_workspace ON ${table}(workspace)`);
  }
  db.exec("INSERT OR IGNORE INTO scoped_settings SELECT 'legacy',key,body FROM settings WHERE key IN ('profile','cv','saved')");
  const catalogue = createCatalogue(db, options.fetcher);
  type Table = 'applications' | 'candidates' | 'needs';
  function list<T>(table: Table): T[] { return (db.prepare(`SELECT body FROM ${table} WHERE workspace=? ORDER BY rowid DESC`).all(workspaceId()) as { body: string }[]).map(r => JSON.parse(r.body) as T); }
  function get<T>(table: Table, id: string): T { const row = db.prepare(`SELECT body FROM ${table} WHERE id=? AND workspace=?`).get(id, workspaceId()) as { body: string } | undefined; if (!row) throw new HttpError(404, 'Cet élément est introuvable.'); return JSON.parse(row.body) as T; }
  function put(table: Table, entity: { id: string }) { db.prepare(`INSERT INTO ${table} (id,body,workspace) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body WHERE workspace=excluded.workspace`).run(entity.id, JSON.stringify(entity), workspaceId()); }
  function setting<T>(key: string, fallback: T): T { const row = db.prepare('SELECT body FROM scoped_settings WHERE workspace=? AND key=?').get(workspaceId(), key) as { body: string } | undefined; return row ? JSON.parse(row.body) as T : fallback; }
  function set(key: string, value: unknown) { db.prepare('INSERT INTO scoped_settings (workspace,key,body) VALUES (?,?,?) ON CONFLICT(workspace,key) DO UPDATE SET body=excluded.body').run(workspaceId(), key, JSON.stringify(value)); }
  function workspace(): Workspace { const staff = workspaceContext.getStore()?.staff; return { profile: setting('profile', blankProfile), cv: cvSchema.parse(setting('cv', blankCV)), saved: setting<unknown[]>('saved', []).filter((id): id is string => typeof id === 'string' && /^\d{4}:\d+$/.test(id)), applications: list<Application>('applications').map(a => staff || a.status === 'published' ? a : { ...a, review: null }), candidates: staff ? list('candidates') : [], needs: staff ? list('needs') : [], planner: plannerSchema.parse(setting('planner', blankPlanner)), draftKey: workspaceId(), demoApplicationId: setting('demoApplicationId', null) }; }
  function compatible(need: Need, candidate: Candidate) {
    return candidate.verified && normal(candidate.subject) === normal(need.subject) && normal(candidate.city) === normal(need.city) && candidate.date === need.date && candidate.start <= need.start && candidate.end >= need.end && !list<Need>('needs').some(n => n.id !== need.id && n.candidateId === candidate.id && ['confirmed', 'completed'].includes(n.status) && n.date === need.date && n.start < need.end && n.end > need.start);
  }
  const app = express(); app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use((_req,res,next) => { res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('Referrer-Policy','same-origin'); res.setHeader('X-Frame-Options','DENY'); res.setHeader('Permissions-Policy','geolocation=(self), camera=(), microphone=()'); next(); });
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
    const allowedHosts = ['127.0.0.1', 'localhost', '[::1]'];
    if (!allowedHosts.includes(req.hostname) && (!config.origin || req.hostname !== new URL(config.origin).hostname)) return res.status(403).json({ error: 'Hôte non autorisé.' });
    const expected = config.origin || `${req.protocol}://${req.headers.host}`;
    if (req.headers.origin && req.headers.origin !== expected) return res.status(403).json({ error: 'Origine de la requête non autorisée.' });
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.path !== '/attachments' && req.get('content-type')?.split(';')[0]?.trim() !== 'application/json') return res.status(415).json({ error: 'Le format JSON est nécessaire.' });
    if (req.path === '/attachments' && req.method === 'POST' && !req.is('multipart/form-data')) return res.status(415).json({ error: 'Choisissez une image PNG, JPEG ou WebP.' });
    next();
  });
  app.use('/api/backup', express.json({ limit: '1mb' }));
  app.use(express.json({ limit: '256kb' }));
  installAuth(app, db, config);
  installAttachments(app, db);
  const filters = { q: z.string().max(100).default(''), region: z.string().max(100).default(''), institution: z.string().regex(/^[A-Za-z0-9]*$/).max(12).default(''), type: z.string().max(100).default(''), sector: z.enum(['', 'public', 'private']).default(''), apprenticeship: z.enum(['', 'yes', 'no']).default('') };
  app.get('/api/health', (_req, res) => res.json({ ok: true, storage: 'sqlite', mode: 'isolated-demo' }));
  app.get('/api/catalogue/map', async (req,res) => { const input = z.object(filters).parse(req.query); res.json(await catalogue.map(input.q,input)); });
  app.get('/api/catalogue', async (req,res) => { const input = z.object({ ...filters, page: z.coerce.number().int().min(1).max(416).default(1) }).parse(req.query); res.json(await catalogue.list(input.q, input.page,input)); });
  app.get('/api/catalogue/:id', async (req,res) => { const id = z.string().regex(/^\d{4}:\d+$/).parse(req.params.id); const detail = await catalogue.detail(id, req.query.history !== 'false'); if (!detail) throw new HttpError(404, 'Formation introuvable dans le catalogue officiel.'); res.json(detail); });
  app.get('/api/workspace', (_req, res) => res.json(workspace()));
  app.put('/api/profile', (req, res) => { set('profile', profileSchema.parse(req.body)); res.json(workspace()); });
  app.put('/api/cv', (req, res) => {
    const cv = cvSchema.parse(req.body), previous = cvSchema.parse(setting('cv', blankCV));
    for (const award of cv.awards) if (award.attachmentId && !db.prepare('SELECT id FROM attachments WHERE id=? AND workspace=?').get(award.attachmentId, workspaceId())) throw new HttpError(400, 'Pièce jointe introuvable.');
    db.exec('BEGIN IMMEDIATE');
    try { set('cv', cv); for(const award of previous.awards) if(award.attachmentId && !cv.awards.some(a => a.attachmentId === award.attachmentId)) db.prepare('DELETE FROM attachments WHERE id=? AND workspace=?').run(award.attachmentId,workspaceId()); db.exec('COMMIT'); } catch(e) { db.exec('ROLLBACK'); throw e; }
    res.json(workspace());
  });
  app.put('/api/saved', (req, res) => { set('saved', savedSchema.parse(req.body)); res.json(workspace()); });
  app.put('/api/planner', (req, res) => { set('planner', plannerSchema.parse(req.body)); res.json(workspace()); });
  app.get('/api/backup', (_req, res) => {
    const data = workspace();
    res.json({ format: 'declic-personal-backup', version: 1, profile: data.profile, cv: { ...data.cv, awards: data.cv.awards.map(a => ({ ...a, attachmentId: null })) }, saved: data.saved, planner: data.planner });
  });
  app.post('/api/backup', (req, res) => {
    const input = backupSchema.parse(req.body);
    db.exec('BEGIN IMMEDIATE');
    try { set('profile', input.profile); set('cv', input.cv); set('saved', input.saved); set('planner', input.planner); db.exec('COMMIT'); }
    catch (error) { db.exec('ROLLBACK'); throw error; }
    res.json(workspace());
  });
  app.post('/api/demo/scenario', requireStaff, (req, res) => {
    const { language } = z.object({ language: z.enum(['fr', 'en']) }).parse(req.body);
    const existing = setting<string | null>('demoApplicationId', null);
    if (existing && list<Application>('applications').some(a => a.id === existing)) return res.json(workspace());
    const now = new Date().toISOString(), id = randomUUID(), english = language === 'en';
    const record: Application = { id, reference: 'DEMO-' + id.slice(0, 8).toUpperCase(), formation: english ? 'Fictional programme — guided demo' : 'Formation fictive — parcours guidé', summary: english ? 'Fictional student: a group science project and volunteer tutoring. Suggested criterion: ability to explain an approach. Review the evidence, write an explanation, save, then share a response. No real application or candidate is involved.' : 'Élève fictif : projet scientifique en groupe et tutorat bénévole. Critère suggéré : expliquer une démarche. Examinez les éléments, rédigez votre explication, enregistrez puis partagez une réponse. Aucun candidat ni dossier réel.', status: 'pending', review: null, questions: [], createdAt: now, updatedAt: now };
    db.exec('BEGIN IMMEDIATE');
    try { put('applications', record); set('demoApplicationId', id); db.exec('COMMIT'); }
    catch (error) { db.exec('ROLLBACK'); throw error; }
    res.status(201).json(workspace());
  });
  app.use('/api', (req,res,next) => {
    const guarded = /^\/(needs|candidates)(\/|$)/.test(req.path) || req.path === '/applications' && req.method === 'POST' || /^\/applications\/[^/]+\/(review|publish)(\/|$)/.test(req.path) || /^\/applications\/[^/]+\/questions\/[^/]+$/.test(req.path);
    return guarded ? requireStaff(req,res,next) : next();
  });
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
    if (error instanceof multer.MulterError) { res.status(400).json({ error: 'Image illisible ou trop grande. Utilisez un PNG, JPEG ou WebP de 8 Mo maximum.' }); return; }
    if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') { res.status(400).json({ error: 'Le contenu envoyé est invalide ou trop volumineux.' }); return; }
    console.error(error); res.status(500).json({ error: 'L’enregistrement a échoué. Réessayez sans quitter votre saisie.' });
  };
  app.use(errorHandler);
  return { app, close: () => db.close() };
}
