import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { detectLanguage, setLanguage, t } from '../src/i18n';
import { CVEditor } from '../src/CVEditor';
import { blankCV, blankProfile } from '../shared/models';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from '@babel/parser';

test('uses French only for a French primary browser language; otherwise English', () => { for (const locale of ['fr', 'fr-FR', 'fr-CA']) assert.equal(detectLanguage([locale]), 'fr'); for (const locale of ['en-US', 'es-ES', 'de-DE', '', 'unknown']) assert.equal(detectLanguage([locale]), 'en'); assert.equal(detectLanguage(['es-ES', 'fr-FR']), 'en'); assert.equal(detectLanguage([]), 'en'); });
test('switches translated labels, placeholders and interpolated messages', () => { setLanguage('en'); assert.equal(t('Mon dossier'), 'My profile'); assert.equal(t('*Votre prénom*'), '*Your first name*'); assert.equal(t('Rubriques renseignées : {count} / 6', { count: 2 }), 'Completed sections: 2 / 6'); setLanguage('fr'); assert.equal(t('Mon dossier'), 'Mon dossier'); });
test('translates the CV interface without translating user-authored content', () => { setLanguage('en'); const cv = { ...blankCV, title: 'Formation', about: 'Mon texte personnel, conservé tel quel.' }; const html = renderToStaticMarkup(<CVEditor cv={cv} savedCV={cv} setCV={() => {}} profile={{ ...blankProfile, firstname: 'Prénom' }} save={async () => {}}/>); assert.ok(html.includes('Your CV, step by step.')); assert.ok(html.includes('Completed sections: 1 / 7')); assert.ok(html.includes('Mon texte personnel, conservé tel quel.')); assert.ok(html.includes('>Formation</p>')); setLanguage('fr'); });
test('every literal translation key in the interface has an English entry', () => {
  const dictionary = JSON.parse(readFileSync('src/locales/en.json', 'utf8')) as Record<string, string>; const missing = new Set<string>();
  function walk(value: unknown) { if (!value || typeof value !== 'object') return; const node = value as Record<string, unknown>; const call = node as { type?: string; callee?: { name?: string }; arguments?: { type?: string; value?: string }[] }; if (call.type === 'CallExpression' && call.callee?.name === 't' && call.arguments?.[0]?.type === 'StringLiteral') { const key = call.arguments[0].value!.trim().replace(/^\*|\*$/g, ''); if (!dictionary[key] && !['Déclic', 'déclic'].includes(key)) missing.add(key); } for (const [key, child] of Object.entries(node)) { if (['loc', 'extra', 'comments', 'tokens'].includes(key)) continue; if (Array.isArray(child)) child.forEach(walk); else walk(child); } }
  for (const filename of readdirSync('src').filter(f => /\.tsx?$/.test(f))) walk(parse(readFileSync('src/' + filename, 'utf8'), { sourceType: 'module', plugins: ['typescript', 'jsx'] }));
  assert.deepEqual([...missing], []);
});
