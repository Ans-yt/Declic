import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export function readComparison(raw: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? [...new Set(parsed.filter((id): id is string => typeof id === 'string' && /^\d{4}:\d+$/.test(id)))].slice(0, 4) : [];
  } catch { return []; }
}
export function useComparison(workspace: string): [string[], Dispatch<SetStateAction<string[]>>] {
  const key = 'declic:comparison:' + workspace;
  const [ids, setIds] = useState<string[]>(() => { try { return readComparison(sessionStorage.getItem(key)); } catch { return []; } });
  useEffect(() => { try { sessionStorage.setItem(key, JSON.stringify(ids)); } catch { /* In-memory comparison remains usable when storage is unavailable. */ } }, [ids, key]);
  return [ids, setIds];
}
