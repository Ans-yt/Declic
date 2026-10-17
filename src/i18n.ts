import { useSyncExternalStore } from 'react';
import en from './locales/en.json';

export type Language = 'fr' | 'en';
export function detectLanguage(languages: readonly string[] = []): Language { return /^fr(?:-|$)/i.test(languages[0] || '') ? 'fr' : 'en'; }
function initialLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  try { const saved = localStorage.getItem('declic.language'); if (saved === 'fr' || saved === 'en') return saved; } catch { /* Browser preferences may be disabled. */ }
  return detectLanguage(typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language]);
}
let language: Language = initialLanguage();
const frenchByEnglish = Object.fromEntries(Object.entries(en).map(([fr, english]) => [english, fr]));
const listeners = new Set<() => void>();
export function getLanguage() { return language; }
export function tr(fr: string, en: string) { return language === 'fr' ? fr : en; }
export function setLanguage(next: Language) { language = next; try { localStorage.setItem('declic.language', next); } catch { /* The switch still works without persistence. */ } for (const listener of listeners) listener(); }
export function useLanguage() { return useSyncExternalStore(callback => { listeners.add(callback); return () => { listeners.delete(callback); }; }, getLanguage, () => 'en' as const); }
export function t(value: string, params: Record<string, string | number> = {}): string {
  let translated = language === 'fr' ? frenchByEnglish[value.trim()] || value : value;
  if (language === 'en') {
    const key = value.trim();
    translated = (en as Record<string, string>)[key] ?? key;
    if (key.startsWith('*') && key.endsWith('*')) translated = '*' + ((en as Record<string, string>)[key.slice(1, -1)] ?? key.slice(1, -1)) + '*';
    if (value.startsWith(' ') && !translated.startsWith(' ')) translated = ' ' + translated;
    if (value.endsWith(' ') && !translated.endsWith(' ')) translated += ' ';
  }
  return translated.replace(/\{(\w+)\}/g, (match, key: string) => String(params[key] ?? match));
}
export function formatNumber(value: number) { return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-GB').format(value); }
export function formatDate(value: string, options?: Intl.DateTimeFormatOptions) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', options); }
