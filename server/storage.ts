import { accessSync, constants, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

export function databaseLocation(env: NodeJS.ProcessEnv = process.env, cwd = process.cwd()) {
  const source = env.DECLIC_DB?.trim() ? 'DECLIC_DB' : env.DATABASE_URL?.trim() ? 'DATABASE_URL' : 'default';
  let path = (source === 'default' ? 'data/declic.sqlite' : env[source]!).trim();
  // These are local SQLite files, never a remote database connection.
  if (/^(?:file|sqlite):/i.test(path)) {
    if (/[?#]/.test(path)) throw new Error(`${source}: SQLite URL query parameters and fragments are not supported. Set DECLIC_DB to a plain file path.`);
    if (/^file:\/\//i.test(path)) {
      try { path = fileURLToPath(path); }
      catch { throw new Error(`${source}: invalid local SQLite file URL. Set DECLIC_DB to a plain file path.`); }
    } else {
      path = path.replace(/^(?:file|sqlite):/i, '');
      if (path.startsWith('//') && !path.startsWith('///')) throw new Error(`${source}: a SQLite URL must refer to a local file, without a remote hostname.`);
      // sqlite:///absolute/path and sqlite:relative/path are both accepted.
      if (path.startsWith('///')) path = path.replace(/^\/+/, '/');
      try { path = decodeURIComponent(path); }
      catch { throw new Error(`${source}: invalid SQLite path encoding.`); }
    }
  } else if (/^[a-z][a-z\d+.-]*:/i.test(path) && !/^[a-z]:[\\/]/i.test(path) && path !== ':memory:') {
    throw new Error(`${source}: Déclic requires SQLite. PostgreSQL and MySQL URLs are not supported.`);
  }
  if (!path || path.includes('\0')) throw new Error(`${source}: set a non-empty SQLite file path.`);
  if (path === ':memory:') {
    if (env.NODE_ENV === 'production') throw new Error(`${source}: production requires a persistent SQLite file, not :memory:.`);
    return { path, source };
  }
  return { path: resolve(cwd, path), source };
}

export function openDatabase(path: string) {
  if (path === ':memory:') return new DatabaseSync(path);
  try {
    const parent = dirname(path);
    mkdirSync(parent, { recursive: true });
    if (existsSync(path)) {
      if (!statSync(path).isFile()) throw new Error('TARGET_IS_NOT_A_FILE');
      accessSync(path, constants.R_OK | constants.W_OK);
    }
    // SQLite also writes journal/WAL files beside the database.
    accessSync(parent, constants.R_OK | constants.W_OK | constants.X_OK);
    return new DatabaseSync(path);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code || (error instanceof Error && error.message === 'TARGET_IS_NOT_A_FILE' ? 'TARGET_IS_NOT_A_FILE' : 'SQLITE_OPEN_FAILED');
    throw new Error(`Cannot open SQLite file ${JSON.stringify(path)} (${code}). Set DECLIC_DB to a FILE inside the persistent volume, not the volume directory. The runtime user must be able to read/write the file and create journal files in its parent directory. No temporary database fallback was used.`);
  }
}
