import type { Workspace } from '../shared/models';
import { t } from './i18n';
export async function api<T = Workspace>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try { response = await fetch('/api' + path, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal }); }
  catch { throw new Error(t('Le serveur ne répond pas.')); }
  const result = await response.json().catch(() => null);
  if (response.status === 401 && typeof window !== 'undefined' && path !== '/auth/login') window.dispatchEvent(new Event('declic:authrequired'));
  if (!response.ok) throw new Error(t(result?.error?.startsWith('Vérifiez les champs') ? 'Vérifiez les champs et réessayez.' : result?.error || 'Le serveur ne répond pas.'));
  return result as T;
}
