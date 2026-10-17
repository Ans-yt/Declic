import express from 'express';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createApp } from './app.js';

const dbPath = resolve(process.env.DECLIC_DB || 'data/declic.sqlite');
mkdirSync(dirname(dbPath), { recursive: true });
const { app, close } = createApp(dbPath);
const development = process.argv[1].endsWith('.ts');
app.use('/assets', express.static(resolve('assets')));
if (development) {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
} else {
  app.use(express.static(resolve('dist')));
  app.get('/{*path}', (_req, res) => res.sendFile(resolve('dist/index.html')));
}
const port = Number(process.env.PORT || 4173);
const server = app.listen(port, '127.0.0.1', () => console.log(`Déclic : http://127.0.0.1:${port} — ${development ? 'développement' : 'version compilée'}`));
server.on('error', error => { console.error(error.message); close(); process.exit(1); });
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => { server.close(() => { close(); process.exit(0); }); });
