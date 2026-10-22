import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clearDraft, recoverDraft, saveDraft } from '../src/lib/drafts';
import { blankCV, cvDraftSchema } from '../shared/models';
function memoryStorage() {
  const values = new Map<string, string>();
  return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
test('draft recovery restores unsaved work only against the same saved snapshot and workspace', () => {
  const storage = memoryStorage(), saved = { firstname: '', skills: [] }, draft = { firstname: 'Camille', skills: ['Dessin'] };
  saveDraft('visitor-one/profile', saved, draft, storage);
  assert.deepEqual(recoverDraft('visitor-one/profile', saved, storage), draft);
  assert.equal(recoverDraft('visitor-two/profile', saved, storage), null);
  assert.equal(recoverDraft('visitor-one/profile', { ...saved, firstname: 'Autre' }, storage), null);
});
test('saving the draft or explicitly clearing it removes recovery data', () => {
  const storage = memoryStorage(), saved = { firstname: '' }, draft = { firstname: 'Camille' };
  saveDraft('profile', saved, draft, storage);
  saveDraft('profile', draft, draft, storage);
  assert.equal(recoverDraft('profile', draft, storage), null);
  saveDraft('profile', saved, draft, storage);
  clearDraft('profile', storage);
  assert.equal(storage.values.size, 0);
});
test('malformed or unsupported recovery records never replace saved data', () => {
  const storage = memoryStorage(), saved = { firstname: '' };
  saveDraft('profile', saved, { firstname: 'Camille' }, storage);
  const key = [...storage.values.keys()][0];
  for (const value of ['not-json', JSON.stringify({ version: 99, base: JSON.stringify(saved), draft: saved }), JSON.stringify({ version: 1, base: JSON.stringify(saved), draft: { firstname: 42 } })]) {
    storage.setItem(key, value);
    assert.equal(recoverDraft('profile', saved, storage), null);
  }
});
test('blocked storage leaves editing and recovery helpers usable', () => {
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); }, removeItem() { throw Error('blocked'); } };
  assert.doesNotThrow(() => saveDraft('profile', {}, { title: 'A' }, blocked));
  assert.doesNotThrow(() => clearDraft('profile', blocked));
  assert.equal(recoverDraft('profile', {}, blocked), null);
});
test('a runtime validator rejects invalid nested CV entries while preserving incomplete award drafts', () => {
  const storage = memoryStorage();
  const validate = (value: unknown) => { const parsed = cvDraftSchema.safeParse(value); return parsed.success ? parsed.data : null; };
  saveDraft<unknown>('cv', blankCV, { ...blankCV, education: [42] }, storage);
  assert.equal(recoverDraft('cv', blankCV, storage, validate), null);
  const draft = { ...blankCV, awards: [{ id: '41d5c28d-aae1-430b-9543-6814e2774500', title: '', organization: '', date: '', detail: '', attachmentId: null }] };
  saveDraft('cv', blankCV, draft, storage);
  assert.deepEqual(recoverDraft('cv', blankCV, storage, validate), draft);
});
