import express from 'express';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';
import { createApp } from './app.js';
import { databaseLocation } from './storage.js';

if (existsSync('.env')) loadEnvFile('.env');
const database = databaseLocation();
console.log(`[storage] SQLite file ${JSON.stringify(database.path)} (source: ${database.source})`);
const { app, close } = createApp(database.path);
const development = process.argv[1].endsWith('.ts');
app.use('/assets', express.static(resolve('assets')));
app.get('/{*path}', (req,res,next) => { if (/^\/(?:src|server|shared|node_modules|\.env|data|tests)\b/.test(req.path) && !development) return res.sendStatus(404); next(); });
if (development) {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
} else {
  app.use(express.static(resolve('dist')));
  app.get('/{*path}', (_req, res) => res.sendFile(resolve('dist/index.html')));
}
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
const server = app.listen(port, host, () => console.log(`Déclic : port ${port} — ${development ? 'développement' : 'version compilée'}`));
server.on('error', error => { console.error(error.message); close(); process.exit(1); });
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => { server.close(() => { close(); process.exit(0); }); });
