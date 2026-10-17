import type { Express } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import multer from 'multer';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { workspaceId } from './auth.js';

export function installAttachments(app: Express, db: DatabaseSync) {
  db.exec('CREATE TABLE IF NOT EXISTS attachments (id TEXT PRIMARY KEY, workspace TEXT NOT NULL, image BLOB NOT NULL, created_at INTEGER NOT NULL)');
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 0 } });
  app.post('/api/attachments', upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Choisissez une image PNG, JPEG ou WebP.' });
    const usage = db.prepare('SELECT COUNT(*) AS count,COALESCE(SUM(length(image)),0) AS bytes FROM attachments WHERE workspace=?').get(workspaceId()) as { count: number; bytes: number };
    if (usage.count >= 40 || usage.bytes >= 20 * 1024 * 1024) return res.status(409).json({ error: 'Limite de pièces jointes atteinte. Retirez une image pour continuer.' });
    let image: Buffer;
    try {
      const input = sharp(req.file.buffer, { limitInputPixels: 20_000_000, animated: false });
      const metadata = await input.metadata();
      if (!['jpeg', 'png', 'webp'].includes(metadata.format || '')) throw new Error();
      // Re-encoding validates real pixels and strips EXIF/location metadata and embedded payloads.
      image = await input.rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    } catch { return res.status(400).json({ error: 'Image illisible ou trop grande. Utilisez un PNG, JPEG ou WebP de 8 Mo maximum.' }); }
    const current = db.prepare('SELECT COUNT(*) AS count,COALESCE(SUM(length(image)),0) AS bytes FROM attachments WHERE workspace=?').get(workspaceId()) as { count: number; bytes: number };
    if (current.count >= 40 || current.bytes + image.length > 20 * 1024 * 1024) return res.status(409).json({ error: 'Limite de pièces jointes atteinte. Retirez une image pour continuer.' });
    const id = randomUUID(); db.prepare('INSERT INTO attachments VALUES (?,?,?,?)').run(id, workspaceId(), image, Date.now());
    res.status(201).json({ id, url: '/api/attachments/' + id });
  });
  app.get('/api/attachments/:id', (req, res) => {
    const row = db.prepare('SELECT image FROM attachments WHERE id=? AND workspace=?').get(req.params.id, workspaceId()) as { image: Uint8Array } | undefined;
    if (!row) return res.status(404).json({ error: 'Pièce jointe introuvable.' });
    res.type('image/webp').set('Content-Disposition', 'inline').send(Buffer.from(row.image));
  });
  app.delete('/api/attachments/:id', (req, res) => {
    // A saved CV must never be left pointing at a deleted proof.
    const row = db.prepare("SELECT body FROM scoped_settings WHERE workspace=? AND key='cv'").get(workspaceId()) as { body: string } | undefined;
    if (row && (JSON.parse(row.body).awards || []).some((award: { attachmentId?: string }) => award.attachmentId === req.params.id)) return res.status(409).json({ error: 'Retirez l’image du CV et enregistrez avant de la supprimer.' });
    db.prepare('DELETE FROM attachments WHERE id=? AND workspace=?').run(req.params.id, workspaceId());
    res.json({ ok: true });
  });
}
