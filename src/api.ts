import type { Workspace } from '../shared/models';
export async function api<T = Workspace>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch('/api' + path, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || 'Le serveur est indisponible. Votre saisie est conservée à l’écran ; réessayez.');
  return result as T;
}
