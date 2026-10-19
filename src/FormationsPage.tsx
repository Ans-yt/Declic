import { SubjectCards } from './SubjectCards';
import { subjects } from './subjects';
import { Select } from './components/Controls';
import { Checkbox } from './components/ui/checkbox';
import { lazy, Suspense, useEffect, useState } from 'react';
import type { CataloguePage, Establishment } from '../shared/catalogue';
import type { Mutate } from './Admissions';
import { api } from './api';
import { formatNumber, t, tr } from './i18n';
import { Empty, Heading, Icon, useAction } from './ui';
import { LoadState, Source, selection, sector, useRemote } from './FormationExplorer';
import { regions } from './geography';
const FranceMap = lazy(() => import('./FranceMap'));

export function Formations({ saved, mutate, compared, setCompared }: { saved: string[]; mutate: Mutate; compared: string[]; setCompared: (ids: string[]) => void }) {
  const [query, setQuery] = useState(''), [search, setSearch] = useState(''), [page, setPage] = useState(1), [filter, setFilter] = useState('all');
  const [region, setRegion] = useState(''), [institution, setInstitution] = useState<Establishment | null>(null), [showMap, setShowMap] = useState(true);
  const action = useAction();
  useEffect(() => {
    function fromSubject() { const subject = subjects.find(s => s.id === location.hash.slice(1).split('/')[1]); if (subject) { setQuery(subject.query); setSearch(subject.query); setPage(1); setFilter('all'); setInstitution(null); } }
    fromSubject(); window.addEventListener('hashchange', fromSubject); return () => window.removeEventListener('hashchange', fromSubject);
  }, []);
  useEffect(() => { if (query.trim() === search) return; const timeout = setTimeout(() => { setSearch(query.trim()); setPage(1); }, 350); return () => clearTimeout(timeout); }, [query, search]);
  const request = useRemote(async () => {
    if (filter === 'saved') {
      const chosen = await selection(saved);
      const matches = chosen.results.filter(f => (!region || f.region === region) && (!institution || f.institutionCode === institution.code) && [f.name, f.institution, f.city, f.region].join(' ').toLocaleLowerCase().includes(search.toLocaleLowerCase()));
      return { ...chosen, results: matches.slice((page - 1) * 24, page * 24), total: matches.length, page, pageSize: 24, year: null };
    }
    return { ...await api<CataloguePage>('/catalogue?' + new URLSearchParams({ q: search, region, institution: institution?.code || '', page: String(page) })), failed: 0 };
  }, [search, page, filter, region, institution?.code, saved.join('|')]);
  const data = request.data, pageCount = data ? Math.min(416, Math.ceil(data.total / 24)) : 0;
  function chooseRegion(next: string) { setRegion(next); setInstitution(null); setPage(1); }
  return <>
    <Heading title={tr('Explorez les possibles.', 'Explore your possibilities.')}>{tr('Cherchez une piste, gardez celles qui vous parlent, comparez-les ensuite.', 'Find programmes, save the ones you like and compare your options.')}</Heading>
    <SubjectCards/>
    <form className="formation-search" onSubmit={e => { e.preventDefault(); setSearch(query.trim()); setPage(1); }}>
      <label className="search-field"><Icon name="search"/><input maxLength={100} aria-label={t('Rechercher une formation')} value={query} onChange={e => setQuery(e.target.value)} placeholder={t('Rechercher une formation, un domaine, une ville…')}/></label>
      <label className="region-select"><span>{tr('Région', 'Region')}</span><Select value={region} onChange={e => chooseRegion(e.target.value)}><option value="">{tr('Toute la France', 'All of France')}</option>{regions.map(name => <option key={name}>{name}</option>)}</Select></label>
      <button className="button">{tr('Rechercher', 'Search')}</button>
    </form>
    <div className="catalogue-view-options"><label>{tr('Afficher', 'Show')}<Select aria-label={tr('Afficher les formations', 'Show programmes')} value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}><option value="all">{tr('Toutes les formations', 'All programmes')}</option><option value="saved">{t('Mes favoris')}</option></Select></label><button className="text-link" aria-expanded={showMap && filter !== 'saved'} onClick={() => setShowMap(v => !v)} disabled={filter === 'saved'}>{showMap ? tr('Masquer la carte', 'Hide map') : tr('Afficher la carte', 'Show map')}</button></div>
    {showMap && filter !== 'saved' && <Suspense fallback={<p role="status">{tr('Chargement de la carte…', 'Loading map…')}</p>}><FranceMap query={search} region={region} onRegion={chooseRegion} onInstitution={e => { setInstitution(e); setPage(1); document.getElementById('catalogue-results')?.scrollIntoView({ block: 'start' }); }}/></Suspense>}
    <section id="catalogue-results" className="catalogue-results" aria-label={tr('Résultats des formations', 'Programme results')}>
      {institution && <div className="institution-filter"><Icon name="school"/><span lang="fr">{institution.name}</span><button className="text-link" onClick={() => { setInstitution(null); setPage(1); }}><Icon name="close"/>{tr('Retirer ce filtre', 'Clear this filter')}</button></div>}
      <p className="catalogue-caption">{tr('Les noms des formations et des établissements sont conservés dans leur langue officielle française.', 'Programme and institution names are kept in their official French wording.')}</p>
      <Source source={data?.source || null} year={data?.year}/><LoadState loading={request.loading} error={request.error} reload={request.reload}/>{action.feedback}
      {data && <><p className="catalogue-count" role="status">{formatNumber(data.total)} {tr('formation(s)', 'programme(s)')}{filter === 'saved' ? tr(' dans vos favoris', ' in your favourites') : ''}{region && ` · ${region}`}</p>
        {data.failed > 0 && <div className="inline-error" role="alert">{tr('Certaines formations enregistrées sont indisponibles. Réessayez pour les actualiser.', 'Some saved programmes could not be loaded. Try again to refresh them.')}<button className="text-link" onClick={request.reload}>{t('Réessayer')}</button></div>}
        <div className="formation-grid">{data.results.map(f => <article className={'formation panel' + (compared.includes(f.id) ? ' is-compared' : '')} key={f.id}>
          <div className="formation-top"><span className="outline-token" lang="fr">{f.types.join(' / ')}</span><button className="favorite-button" disabled={action.busy || (!saved.includes(f.id) && saved.length >= 100)} aria-label={tr('Enregistrer : ', 'Save: ') + f.name} aria-pressed={saved.includes(f.id)} onClick={() => void action.run(() => mutate('/saved', saved.includes(f.id) ? saved.filter(id => id !== f.id) : [...saved, f.id], 'PUT'), t('Favoris enregistrés.'))}><Icon name="heart"/></button></div>
          <h2 lang="fr">{f.name}</h2><p lang="fr">{f.institution}</p><div className="metadata"><span><Icon name="school"/>{f.city}</span><span>{f.region}</span><span>{sector(f.sector)}</span>{f.apprenticeship && <span>{tr('Apprentissage', 'Apprenticeship')}</span>}<span>{f.year}</span></div>
          <div className="formation-bottom"><label className="check-label" htmlFor={'compare-' + f.id}><Checkbox id={'compare-' + f.id} disabled={!compared.includes(f.id) && compared.length >= 4} checked={compared.includes(f.id)} onCheckedChange={checked => setCompared(checked === true ? [...compared, f.id] : compared.filter(id => id !== f.id))}/>{t('Comparer')}</label><a className="text-link" href={'#formation/' + f.id}>{tr('Voir la formation', 'View programme')}<Icon name="arrow"/></a></div>
        </article>)}</div>
        {!data.results.length && <Empty title={filter === 'saved' ? tr('Vos pistes commencent ici.', 'Your shortlist starts here.') : tr('Aucune formation trouvée.', 'No programmes found.')} icon="search">{filter === 'saved' ? tr('Enregistrez des formations avec le cœur pour les retrouver ici.', 'Use the heart to save programmes and find them here.') : tr('Essayez un autre domaine, une ville ou un établissement.', 'Try another subject, city or institution.')}</Empty>}
        {pageCount > 1 && <nav className="catalogue-pagination" aria-label={tr('Pages du catalogue', 'Catalogue pages')}><button className="button" disabled={page <= 1} onClick={() => { setPage(v => v - 1); document.getElementById('catalogue-results')?.scrollIntoView(); }}>{tr('Précédent', 'Previous')}</button><span>{tr('Page', 'Page')} {page} / {pageCount}</span><button className="button" disabled={page >= pageCount} onClick={() => { setPage(v => v + 1); document.getElementById('catalogue-results')?.scrollIntoView(); }}>{tr('Suivant', 'Next')}</button></nav>}
        {data.total > 9984 && filter !== 'saved' && <p className="subtle-notice">{tr('Affinez la recherche pour explorer au-delà des 9 984 premiers résultats accessibles par pagination.', 'Refine your search to explore beyond the first 9,984 results accessible through pagination.')}</p>}
      </>}
    </section>
    {compared.length > 0 && <section className="comparison-tray" aria-label={tr('Sélection de formations', 'Selected programmes')}><strong>{compared.length} / 4 {tr('sélectionnées', 'selected')}</strong><div>{compared.map(id => <button key={id} onClick={() => setCompared(compared.filter(v => v !== id))} aria-label={tr('Retirer la formation ', 'Remove programme ') + id}>{id.split(':')[1]}<Icon name="close"/></button>)}</div><button className="button" disabled={compared.length < 2} onClick={() => { location.hash = 'comparer'; }}>{t('Comparer')}<Icon name="arrow"/></button></section>}
  </>;
}
