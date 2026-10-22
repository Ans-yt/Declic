import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { conditions, createCatalogue, normalizeFormation } from '../server/catalogue';
import { catalogueSearchHash, parseCatalogueSearch, type CatalogueFilters } from '../shared/catalogue';
import { escapeCalendarText, personalCalendar } from '../src/ProgrammePlanner';

test('catalogue URLs round-trip composed filters, page, institution and view including subject routes', () => {
  const input = '#formations/architecture?q=arts+%26+design&region=%C3%8Ele-de-France&institution=0750001A&institutionName=%C3%89cole+des+arts&page=3&view=map&type=BTS&sector=private&apprenticeship=yes&saved=1';
  const state = parseCatalogueSearch(input, 'architecture');
  assert.equal(state.q, 'arts & design'); assert.equal(state.page, 3); assert.equal(state.institutionName, 'École des arts');
  assert.deepEqual(parseCatalogueSearch(catalogueSearchHash(state)), state);
  assert.equal(parseCatalogueSearch('#formations/architecture', 'architecture').q, 'architecture');
  assert.equal(parseCatalogueSearch('#formations/architecture?q=', 'architecture').q, '');
  assert.equal(parseCatalogueSearch('#formations').view, 'list');
});

test('invalid URL state is bounded and does not become filter expressions', () => {
  const state = parseCatalogueSearch('#formations?page=99999&view=planet&sector=oops&apprenticeship=unknown&type=' + 'x'.repeat(150));
  assert.equal(state.page, 1); assert.equal(state.view, 'list'); assert.equal(state.type.length, 100); assert.equal(state.sector, ''); assert.equal(state.apprenticeship, '');
  assert.equal(parseCatalogueSearch('#formations?page=1.5').page, 1);
});

test('list and map use identical escaped composed official-data conditions', async () => {
  const db = new DatabaseSync(':memory:');
  const calls: URL[] = [];
  const fetcher = (async (input: string | URL | Request) => {
    const url = new URL(String(input)); calls.push(url);
    const body = url.searchParams.get('group_by') === 'annee' ? { total_count: 1, results: [{ annee: '2026' }] } : url.pathname.endsWith('/exports/json') ? [] : url.pathname.endsWith('/records') ? { total_count: 0, results: [] } : {};
    return new Response(JSON.stringify(body));
  }) as typeof fetch;
  try {
    const filters: CatalogueFilters = { region: 'Île-de-France', institution: '0750001A', type: 'BTS") OR annee="2020', sector: 'private', apprenticeship: 'yes' };
    const catalogue = createCatalogue(db, fetcher);
    await catalogue.list('arts & design', 2, filters); await catalogue.map('arts & design', filters);
    const list = calls.find(url => url.pathname.endsWith('/records') && url.searchParams.has('where'))!;
    const map = calls.find(url => url.pathname.endsWith('/exports/json'))!;
    assert.equal(list.searchParams.get('where'), map.searchParams.get('where'));
    assert.equal(list.searchParams.get('offset'), '24');
    assert.ok(list.searchParams.get('where')!.includes('search(tf, ' + JSON.stringify(filters.type) + ')'));
    assert.ok(list.searchParams.get('where')!.includes('tc="Privés" OR tc="Privés en contrat avec l’Etat / EESC"'));
    assert.ok(list.searchParams.get('where')!.includes('app="Formations en apprentissage"'));
  } finally { db.close(); }
});

test('absent apprenticeship information stays unknown and negative filtering excludes missing values', () => {
  const record = { annee: '2026', gta: '42', etab_uai: '0750001A', nm: ['Licence'], app: [] };
  assert.equal(normalizeFormation(record).apprenticeshipStatus, null);
  assert.equal(normalizeFormation({ ...record, app: ['Formations en apprentissage'] }).apprenticeshipStatus, 'yes');
  assert.ok(conditions(2026, '', { apprenticeship: 'no' }).includes('app IS NOT NULL'));
  assert.ok(!conditions(2026, '', { apprenticeship: 'no' }).includes('app IS NULL'));
});

test('personal calendar escapes user text, folds UTF-8 and exports only dated unfinished tasks for the programme', () => {
  assert.equal(escapeCalendarText('a,b;c\\d\r\nEND:VEVENT'), 'a\\,b\\;c\\\\d\\nEND:VEVENT');
  const task = { id: 'c803227e-78ec-4c5b-ad8c-e17c0c4de7ea', programmeId: '2026:42', title: 'Visiter, puis demander; ' + 'é'.repeat(80) + '\r\nBEGIN:VEVENT', dueDate: '2027-03-02', done: false };
  const result = personalCalendar({ id: '2026:42', name: 'Formation officielle', institution: 'École' }, [task, { ...task, id: 'done', done: true }, { ...task, id: 'undated', dueDate: '' }, { ...task, id: 'other', programmeId: '2026:12' }], new Date('2026-10-21T12:00:00Z'));
  assert.equal(result.match(/^BEGIN:VEVENT\r\n/gm)?.length, 1);
  assert.ok(result.includes('DTSTART;VALUE=DATE:20270302'));
  assert.ok(result.includes('DTSTAMP:20261021T120000Z'));
  assert.ok(result.includes('\\nBEGIN:VEVENT'));
  assert.ok(result.includes('END:VCALENDAR\r\n'));
  for (const line of result.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75, `oversized line: ${line}`);
  const unfolded = result.replace(/\r\n /g, '');
  assert.ok(unfolded.includes('é'.repeat(80)));
  assert.match(unfolded, /date limite officielle|official deadline/);
});
