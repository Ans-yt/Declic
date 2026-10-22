import { useEffect, useState } from 'react';

type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type Validator<T> = (value: unknown) => T | null;
const storageKey = (key: string) => `declic:draft:v1:${key}`;
function session(): DraftStorage | undefined {
  try { return typeof window === 'undefined' ? undefined : window.sessionStorage; } catch { return undefined; }
}
function sameShape(value: unknown, saved: unknown): boolean {
  if (saved === null) return value === null || typeof value === 'string';
  if (Array.isArray(saved)) return Array.isArray(value);
  if (typeof saved === 'object') return !!value && typeof value === 'object' && !Array.isArray(value) && Object.entries(saved).every(([key, child]) => sameShape((value as Record<string, unknown>)[key], child));
  return typeof value === typeof saved;
}
/** Only restore a draft made against this exact saved snapshot. Storage is best effort. */
export function recoverDraft<T>(key: string, saved: T, storage = session(), validate?: Validator<T>): T | null {
  try {
    const raw = storage?.getItem(storageKey(key));
    if (!raw) return null;
    const record = JSON.parse(raw);
    if (record?.version !== 1 || record.base !== JSON.stringify(saved) || !sameShape(record.draft, saved)) return null;
    return validate ? validate(record.draft) : record.draft as T;
  } catch { return null; }
}
export function clearDraft(key: string, storage = session()): void {
  try { storage?.removeItem(storageKey(key)); } catch { /* Editing remains available when browser storage is blocked. */ }
}
export function saveDraft<T>(key: string, saved: T, draft: T, storage = session()): void {
  try {
    if (JSON.stringify(saved) === JSON.stringify(draft)) { clearDraft(key, storage); return; }
    storage?.setItem(storageKey(key), JSON.stringify({ version: 1, base: JSON.stringify(saved), draft }));
  } catch { /* A storage quota or privacy setting must never break the editor. */ }
}
/** Mount after workspace loading, with a key scoped to the current visitor workspace. */
export function useRecoverableDraft<T>(key: string, saved: T, validate?: Validator<T>) {
  const savedJSON = JSON.stringify(saved);
  const [state, setState] = useState(() => {
    const recovered = recoverDraft(key, saved, undefined, validate);
    return { key, base: savedJSON, draft: recovered ?? saved, recovered: recovered !== null };
  });
  // Synchronise before effects: a refresh must not write an old value over a new workspace.
  if (state.key !== key) {
    const recovered = recoverDraft(key, saved, undefined, validate);
    setState({ key, base: savedJSON, draft: recovered ?? saved, recovered: recovered !== null });
  } else if (state.base !== savedJSON) {
    const clean = JSON.stringify(state.draft) === state.base;
    setState({ ...state, base: savedJSON, draft: clean ? saved : state.draft, recovered: clean || JSON.stringify(state.draft) === savedJSON ? false : state.recovered });
  }
  const dirty = JSON.stringify(state.draft) !== savedJSON;
  useEffect(() => { saveDraft(key, saved, state.draft); }, [key, savedJSON, state.draft]);
  return {
    draft: state.draft,
    setDraft: (draft: T) => setState(current => ({ ...current, draft })),
    dirty,
    recovered: state.recovered && dirty,
    clearDraft: () => { clearDraft(key); setState({ key, base: savedJSON, draft: saved, recovered: false }); },
  };
}
