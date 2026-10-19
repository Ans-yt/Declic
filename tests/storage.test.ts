import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readdirSync, unlinkSync, rmdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { databaseLocation, openDatabase } from '../server/storage';

test('host SQLite URLs are used unless an explicit file override is supplied', () => {
  const file = resolve('data', 'host database.sqlite');
  assert.deepEqual(databaseLocation({ DATABASE_URL: pathToFileURL(file).href }), { path: file, source: 'DATABASE_URL' });
  assert.deepEqual(databaseLocation({ DECLIC_DB: 'custom.sqlite', DATABASE_URL: 'postgres://private:secret@db/app' }), { path: resolve('custom.sqlite'), source: 'DECLIC_DB' });
  assert.equal(databaseLocation({ DATABASE_URL: 'sqlite:relative%20file.sqlite' }).path, resolve('relative file.sqlite'));
  assert.equal(databaseLocation({ DATABASE_URL: 'sqlite:///data/app.sqlite' }).path, resolve('/data/app.sqlite'));
  assert.equal(databaseLocation({ DATABASE_URL: 'sqlite:////data/app.sqlite' }).path, resolve('/data/app.sqlite'));
  assert.equal(databaseLocation({ DATABASE_URL: 'file:./data/host.sqlite' }).path, resolve('data/host.sqlite'));
  assert.equal(databaseLocation({}).path, resolve('data/declic.sqlite'));
});

test('unsupported URLs fail without exposing credentials or silently using another database', () => {
  for (const DATABASE_URL of ['postgres://private:secret@db/app', 'mysql://private:secret@db/app', 'sqlite://remote/app', 'file://private:secret@db/app', 'sqlite:app.sqlite?mode=ro']) {
    assert.throws(() => databaseLocation({ DATABASE_URL }), error => error instanceof Error && !error.message.includes('secret') && !error.message.includes('private'));
  }
  assert.throws(() => databaseLocation({ NODE_ENV: 'production', DECLIC_DB: ':memory:' }), /persistent/);
  assert.throws(() => databaseLocation({ DATABASE_URL: 'sqlite:' }), /non-empty/);
});

test('nested SQLite storage persists writes, and directory targets fail with actionable diagnostics', () => {
  const directory = mkdtempSync(join(tmpdir(), 'declic-storage-'));
  const parent = join(directory, 'persistent');
  const path = join(parent, 'declic.sqlite');
  try {
    const db = openDatabase(path);
    db.exec('PRAGMA journal_mode=WAL; CREATE TABLE proof (value TEXT); INSERT INTO proof VALUES (\'saved\')');
    db.close();
    const reopened = openDatabase(path);
    assert.equal(reopened.prepare('SELECT value FROM proof').get()?.value, 'saved');
    reopened.close();
    const target = join(directory, 'directory-not-file');
    mkdirSync(target);
    assert.throws(() => openDatabase(target), /TARGET_IS_NOT_A_FILE.*FILE inside the persistent volume/);
    const blocker = join(directory, 'parent-is-file');
    writeFileSync(blocker, 'fixture');
    assert.throws(() => openDatabase(join(blocker, 'db.sqlite')), /runtime user.*journal files/);
    rmdirSync(target);
    unlinkSync(blocker);
  } finally {
    for (const file of readdirSync(parent)) unlinkSync(join(parent, file));
    rmdirSync(parent);
    rmdirSync(directory);
  }
});
