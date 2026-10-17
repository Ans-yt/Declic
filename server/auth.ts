import type { Express, Request, Response, NextFunction } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { z } from 'zod';
import * as oidc from 'openid-client';
import type { AppConfig } from './config.js';
import type { StaffIdentity } from '../shared/auth.js';

const scrypt = promisify(scryptCallback);
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
const token = () => randomBytes(32).toString('hex');
export const workspaceContext = new AsyncLocalStorage<{ id: string; staff: StaffIdentity | null }>();
export function workspaceId() { const context = workspaceContext.getStore(); if (!context) throw new Error('Workspace context missing'); return context.id; }
export function hashPassword(password: string, salt = randomBytes(16).toString('hex')): Promise<string> { return scrypt(password, salt, 64).then(key => `scrypt:${salt}:${(key as Buffer).toString('hex')}`); }
async function checkPassword(password: string, encoded: string) { const [, salt, hex] = encoded.split(':'); if (!salt || !hex) return false; const key = await scrypt(password, salt, 64) as Buffer; const expected = Buffer.from(hex, 'hex'); return key.length === expected.length && timingSafeEqual(key, expected); }
function cookies(req: Request) { return Object.fromEntries((req.headers.cookie || '').split(';').map(v => v.trim().split('='))); }
export function requireStaff(_req: Request, res: Response, next: NextFunction) { if (!workspaceContext.getStore()?.staff) return res.status(401).json({ error: 'Connectez-vous à votre espace établissement.' }); next(); }

export function installAuth(app: Express, db: DatabaseSync, config: AppConfig) {
  db.exec(`CREATE TABLE IF NOT EXISTS visitors (token_hash TEXT PRIMARY KEY, workspace TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS staff_sessions (token_hash TEXT PRIMARY KEY, workspace TEXT NOT NULL, body TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS login_attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS external_identities (issuer TEXT NOT NULL, subject TEXT NOT NULL, staff_id TEXT NOT NULL, name TEXT NOT NULL, institution TEXT NOT NULL, active INTEGER NOT NULL, PRIMARY KEY(issuer,subject));
    CREATE TABLE IF NOT EXISTS oidc_transactions (state TEXT PRIMARY KEY, workspace TEXT NOT NULL, verifier TEXT NOT NULL, nonce TEXT NOT NULL, expires INTEGER NOT NULL);`);
  const credentialFingerprint = digest(config.staffUsername + ':' + config.staffPasswordHash);
  const previous = db.prepare("SELECT body FROM settings WHERE key='staff_credential_fingerprint'").get() as { body: string } | undefined;
  if (previous?.body !== credentialFingerprint) {
    db.prepare("DELETE FROM staff_sessions WHERE json_extract(body,'$.source')='password'").run();
    db.prepare("INSERT INTO settings VALUES ('staff_credential_fingerprint',?) ON CONFLICT(key) DO UPDATE SET body=excluded.body").run(credentialFingerprint);
  }
  let nextCleanup = 0;
  function cookie(res: Response, name: string, value: string, maxAge: number) { res.cookie(name, value, { httpOnly: true, secure: config.production, sameSite: 'lax', path: '/', maxAge }); }
  function login(res: Response, identity: StaffIdentity) { const value = token(); const id = workspaceId(); db.prepare('INSERT INTO staff_sessions VALUES (?,?,?,?)').run(digest(value), id, JSON.stringify(identity), Date.now() + 12 * 3600_000); cookie(res, 'declic_staff', value, 12 * 3600_000); }
  app.use('/api', (req, res, next) => {
    if (/^\/(catalogue|health)(\/|$)/.test(req.path)) return next();
    const jar = cookies(req), now = Date.now();
    if(now > nextCleanup) { db.prepare('DELETE FROM staff_sessions WHERE expires<?').run(now); db.prepare('DELETE FROM visitors WHERE expires<?').run(now); db.prepare('DELETE FROM oidc_transactions WHERE expires<?').run(now); nextCleanup = now + 3600_000; }
    let visitor = /^[a-f0-9]{64}$/.test(jar.declic_visitor || '') ? db.prepare('SELECT workspace FROM visitors WHERE token_hash=? AND expires>?').get(digest(jar.declic_visitor), now) as { workspace: string } | undefined : undefined;
    if (!visitor) {
      const value = token();
      // Claim old single-user drafts once, only on a local development visit.
      const claimed = db.prepare("SELECT key FROM settings WHERE key='legacy_claimed'").get();
      const legacy = !config.production && !claimed;
      visitor = { workspace: legacy ? 'legacy' : randomUUID() };
      if (legacy) db.prepare("INSERT OR IGNORE INTO settings VALUES ('legacy_claimed','true')").run();
      db.prepare('INSERT INTO visitors VALUES (?,?,?)').run(digest(value), visitor.workspace, now + 180 * 86400_000);
      cookie(res, 'declic_visitor', value, 180 * 86400_000);
    }
    const row = /^[a-f0-9]{64}$/.test(jar.declic_staff || '') ? db.prepare('SELECT body FROM staff_sessions WHERE token_hash=? AND workspace=? AND expires>?').get(digest(jar.declic_staff), visitor.workspace, now) as { body: string } | undefined : undefined;
    workspaceContext.run({ id: visitor.workspace, staff: row ? JSON.parse(row.body) : null }, next);
  });
  app.get('/api/auth/session', (_req, res) => res.json({ staff: workspaceContext.getStore()!.staff, passwordEnabled: !!(config.staffUsername && config.staffPasswordHash) }));
  app.post('/api/auth/login', async (req, res) => {
    const input = z.object({ username: z.string().trim().max(120), password: z.string().min(1).max(300) }).parse(req.body);
    const key = digest(req.ip || 'unknown'), now = Date.now();
    db.prepare('DELETE FROM login_attempts WHERE reset<?').run(now);
    const attempt = db.prepare('SELECT count FROM login_attempts WHERE key=?').get(key) as { count: number } | undefined;
    if (attempt && attempt.count >= 8) { res.setHeader('Retry-After', '900'); return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }); }
    if (!config.staffUsername || !config.staffPasswordHash) return res.status(503).json({ error: 'L’accès établissement doit être activé par l’administrateur.' });
    db.prepare('INSERT INTO login_attempts VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key, now + 900_000);
    // Derive the password even for a wrong username to avoid username timing disclosure.
    const valid = await checkPassword(input.password, config.staffPasswordHash);
    if (!valid || input.username !== config.staffUsername) return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
    db.prepare('DELETE FROM login_attempts WHERE key=?').run(key);
    if (cookies(req).declic_staff) db.prepare('DELETE FROM staff_sessions WHERE token_hash=?').run(digest(cookies(req).declic_staff));
    login(res, { id: 'configured-staff', name: config.staffUsername, institution: config.institution, source: 'password' });
    res.json({ ok: true });
  });
  app.post('/api/auth/logout', (req, res) => { if (cookies(req).declic_staff) db.prepare('DELETE FROM staff_sessions WHERE token_hash=?').run(digest(cookies(req).declic_staff)); cookie(res, 'declic_staff', '', 0); res.json({ ok: true }); });

  // Back-office provisioning only. Never trust a professor ID or role supplied by a browser.
  app.post('/api/integrations/identities', (req, res) => {
    if (!config.integrationToken) return res.status(503).json({ error: 'Intégration institutionnelle non configurée.' });
    const given = req.headers.authorization?.replace(/^Bearer /, '') || '';
    if (!timingSafeEqual(Buffer.from(digest(given)), Buffer.from(digest(config.integrationToken)))) return res.status(401).json({ error: 'Accès intégration non autorisé.' });
    const input = z.object({ issuer: z.url(), subject: z.string().min(1).max(300), staffId: z.string().min(1).max(120), name: z.string().min(1).max(120), institution: z.string().min(1).max(120), active: z.boolean() }).parse(req.body);
    if (!config.oidcIssuer || input.issuer !== config.oidcIssuer) return res.status(400).json({ error: 'Fournisseur d’identité non autorisé.' });
    const previousIdentity = db.prepare('SELECT staff_id FROM external_identities WHERE issuer=? AND subject=?').get(input.issuer, input.subject) as { staff_id: string } | undefined;
    db.prepare('INSERT INTO external_identities VALUES (?,?,?,?,?,?) ON CONFLICT(issuer,subject) DO UPDATE SET staff_id=excluded.staff_id,name=excluded.name,institution=excluded.institution,active=excluded.active').run(input.issuer, input.subject, input.staffId, input.name, input.institution, +input.active);
    // Changes and revocations take effect immediately, including for existing sessions.
    db.prepare("DELETE FROM staff_sessions WHERE json_extract(body,'$.id')=?").run(input.staffId);
    if(previousIdentity) db.prepare("DELETE FROM staff_sessions WHERE json_extract(body,'$.id')=?").run(previousIdentity.staff_id);
    res.status(201).json({ ok: true });
  });
  let oidcConfiguration: Promise<oidc.Configuration> | null = null;
  function provider() {
    if (!config.origin || !config.oidcIssuer || !config.oidcClientId || !config.oidcClientSecret) return null;
    return oidcConfiguration ||= oidc.discovery(new URL(config.oidcIssuer), config.oidcClientId, config.oidcClientSecret).catch(e => { oidcConfiguration = null; throw e; });
  }
  app.get('/api/auth/oidc/start', async (_req, res) => {
    const configured = provider(); if (!configured) return res.status(503).json({ error: 'Intégration institutionnelle non configurée.' });
    try {
      const client = await configured, state = oidc.randomState(), verifier = oidc.randomPKCECodeVerifier(), nonce = oidc.randomNonce();
      db.prepare('DELETE FROM oidc_transactions WHERE expires<?').run(Date.now());
      db.prepare('INSERT INTO oidc_transactions VALUES (?,?,?,?,?)').run(digest(state), workspaceId(), verifier, nonce, Date.now() + 600_000);
      const redirect = oidc.buildAuthorizationUrl(client, { redirect_uri: config.origin + '/api/auth/oidc/callback', scope: 'openid profile', code_challenge: await oidc.calculatePKCECodeChallenge(verifier), code_challenge_method: 'S256', state, nonce });
      res.redirect(redirect.href);
    } catch { res.status(503).json({ error: 'Le fournisseur d’identité est indisponible.' }); }
  });
  app.get('/api/auth/oidc/callback', async (req, res) => {
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const transaction = db.prepare('SELECT * FROM oidc_transactions WHERE state=? AND workspace=? AND expires>?').get(digest(state), workspaceId(), Date.now()) as { verifier: string; nonce: string } | undefined;
    db.prepare('DELETE FROM oidc_transactions WHERE state=? AND workspace=?').run(digest(state), workspaceId());
    if (!transaction) return res.status(400).json({ error: 'Connexion expirée ou invalide.' });
    try {
      const configured = provider(); if (!configured) throw new Error();
      const tokens = await oidc.authorizationCodeGrant(await configured, new URL(req.originalUrl, config.origin!), { pkceCodeVerifier: transaction.verifier, expectedState: state, expectedNonce: transaction.nonce, idTokenExpected: true });
      const subject = tokens.claims()?.sub;
      const identity = subject && db.prepare('SELECT staff_id,name,institution FROM external_identities WHERE issuer=? AND subject=? AND active=1').get(config.oidcIssuer, subject) as { staff_id: string; name: string; institution: string } | undefined;
      if (!identity) return res.status(403).json({ error: 'Ce compte n’a pas été autorisé par l’établissement.' });
      login(res, { id: identity.staff_id, name: identity.name, institution: identity.institution, source: 'oidc' });
      res.redirect(config.origin + '/#admissions');
    } catch { res.status(401).json({ error: 'La connexion institutionnelle n’a pas pu être vérifiée.' }); }
  });
}
