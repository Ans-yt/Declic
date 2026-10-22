import { SubjectCards } from './SubjectCards';
import { subjects } from './subjects';
import { Select } from './components/Controls';
import { Checkbox } from './components/ui/checkbox';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { catalogueSearchHash, parseCatalogueSearch, type CataloguePage, type CatalogueSearch } from '../shared/catalogue';
import { blankPlanner, type Planner } from '../shared/models';
import type { Mutate } from './Admissions';
import { api } from './api';
import { formatNumber, t, tr } from './i18n';
import { Empty, Heading, Icon, useAction } from './ui';
import { LoadState, Source, selection, sector, useRemote, cacheProgrammes, cachedProgramme, programmeHref, rememberCatalogue } from './FormationExplorer';
import { ProgrammePlanner } from './ProgrammePlanner';
import { regions } from './geography';
const FranceMap = lazy(() => import('./FranceMap'));

function fromLocation() {
  const subjectId = location.hash.split('?')[0].split('/')[1];
  return parseCatalogueSearch(location.hash, subjects.find(subject => subject.id === subjectId)?.query || '');
}

export function Formations({ saved, mutate, compared, setCompared, planner = blankPlanner }: { saved: string[]; mutate: Mutate; compared: string[]; setCompared: (ids: string[]) => void; planner?: Planner }) {
  const [state, setState] = useState(fromLocation), [query, setQuery] = useState(state.q), [typeDraft, setTypeDraft] = useState(state.type);
  const restoreScroll = useRef(true), action = useAction();
  const { q: search, page, region, institution, institutionName, view, type, sector: chosenSector, apprenticeship, saved: onlySaved } = state;
  const hash = catalogueSearchHash(state);
  function navigate(patch: Partial<CatalogueSearch>) {
    const next = { ...state, q: query.trim(), ...patch }, nextHash = catalogueSearchHash(next);
    restoreScroll.current = false; setState(next);
    if (location.hash !== nextHash) location.hash = nextHash;
  }
  useEffect(() => {
    history.replaceState(history.state, '', catalogueSearchHash(fromLocation()));
    const read = () => { if (!location.hash.startsWith('#formations')) return; const next = fromLocation(); setState(next); setQuery(next.q); setTypeDraft(next.type); restoreScroll.current = true; };
    window.addEventListener('hashchange', read); return () => window.removeEventListener('hashchange', read);
  }, []);
  useEffect(() => { if (query.trim() === search) return; const timeout = setTimeout(() => navigate({ q: query.trim(), page: 1 }), 350); return () => clearTimeout(timeout); }, [query, search]);
  const request = useRemote(async () => {
    if (onlySaved) {
      const chosen = await selection(saved);
      const matches = chosen.results.filter(f => (!region || f.region === region) && (!institution || f.institutionCode === institution) && (!type || f.types.some(value => value.toLocaleLowerCase().includes(type.toLocaleLowerCase()))) && (!chosenSector || (chosenSector === 'public' ? f.sector === 'Publics' : f.sector.startsWith('Privés'))) && (!apprenticeship || f.apprenticeshipStatus === apprenticeship || (apprenticeship === 'yes' && f.apprenticeship)) && [f.name, f.institution, f.city, f.region].join(' ').toLocaleLowerCase().includes(search.toLocaleLowerCase()));
      return { ...chosen, results: matches.slice((page - 1) * 24, page * 24), total: matches.length, page, pageSize: 24, year: null };
    }
    return { ...await api<CataloguePage>('/catalogue?' + new URLSearchParams({ q: search, region, institution, type, sector: chosenSector, apprenticeship, page: String(page) })), failed: 0 };
  }, [search, page, onlySaved, region, institution, type, chosenSector, apprenticeship, saved.join('|')]);
  const selected = useRemote(() => selection(compared), [compared.join('|')]);
  const data = request.data, pageCount = data ? Math.min(416, Math.ceil(data.total / 24)) : 0;
  if (data) cacheProgrammes(data.results);
  if (selected.data) cacheProgrammes(selected.data.results);
  useEffect(() => {
    if (!data || !restoreScroll.current) return; restoreScroll.current = false;
    let top = 0; try { top = Number(sessionStorage.getItem('declic.catalogue.scroll:' + hash)) || 0; } catch { /* Scroll restoration is optional. */ }
    if (top > 0) { const frame = requestAnimationFrame(() => window.scrollTo({ top, behavior: 'instant' })); return () => cancelAnimationFrame(frame); }
  }, [data, hash]);
  function chooseRegion(next: string) { navigate({ region: next, institution: '', institutionName: '', page: 1 }); }
  const hasFilters = !!(search || region || institution || type || chosenSector || apprenticeship);
  return <>
    <Heading title={tr('Explorez les possibles.', 'Explore your possibilities.')}>{tr('Cherchez une piste, gardez celles qui vous parlent, comparez-les ensuite.', 'Find programmes, save the ones you like and compare your options.')}</Heading>
    <SubjectCards/>
    <form className="formation-search" onSubmit={event => { event.preventDefault(); navigate({ q: query.trim(), type: typeDraft.trim(), page: 1 }); }}>
      <label className="search-field"><Icon name="search"/><input maxLength={100} aria-label={t('Rechercher une formation')} value={query} onChange={event => setQuery(event.target.value)} placeholder={t('Rechercher une formation, un domaine, une ville…')}/></label>
      <label className="region-select"><span>{tr('Région', 'Region')}</span><Select value={region} onChange={event => chooseRegion(event.target.value)}><option value="">{tr('Toute la France', 'All of France')}</option>{regions.map(name => <option key={name}>{name}</option>)}</Select></label>
      <button className="button">{tr('Rechercher', 'Search')}</button>
      <details className="catalogue-extra-filters" open={!!(type || chosenSector || apprenticeship)}><summary>{tr('Type, statut et apprentissage', 'Type, sector and apprenticeship')}</summary><div>
        <label className="field">{tr('Diplôme ou type', 'Diploma or type')}<input maxLength={100} value={typeDraft} onChange={event => setTypeDraft(event.target.value)} onBlur={() => { if (typeDraft.trim() !== type) navigate({ type: typeDraft.trim(), page: 1 }); }} placeholder={tr('Ex. BTS, Licence…', 'E.g. BTS, Licence…')}/></label>
        <label className="field">{tr('Statut de l’établissement', 'Institution sector')}<Select value={chosenSector} onChange={event => navigate({ sector: event.target.value as CatalogueSearch['sector'], page: 1 })}><option value="">{tr('Tous les statuts', 'All sectors')}</option><option value="public">{tr('Public', 'Public')}</option><option value="private">{tr('Privé (y compris sous contrat)', 'Private (including state contract)')}</option></Select></label>
        <label className="field">{tr('Apprentissage', 'Apprenticeship')}<Select value={apprenticeship} onChange={event => navigate({ apprenticeship: event.target.value as CatalogueSearch['apprenticeship'], page: 1 })}><option value="">{tr('Toutes les modalités', 'All formats')}</option><option value="yes">{tr('Oui, publié', 'Yes, published')}</option><option value="no">{tr('Non, explicitement publié', 'No, explicitly published')}</option></Select></label>
      </div><p>{tr('Une information absente ne signifie pas « non ». Le filtre « non » exige une mention explicite, rarement publiée dans ce catalogue.', 'Missing information does not mean “no”. The “no” filter requires an explicit statement, rarely published in this catalogue.')}</p></details>
    </form>
    <div className="catalogue-result-summary"><p className="catalogue-count" role="status">{data ? <>{formatNumber(data.total)} {tr('formation(s)', 'programme(s)')}{onlySaved ? tr(' dans vos favoris', ' in your favourites') : ''}</> : request.loading ? tr('Recherche en cours…', 'Searching…') : tr('Résultats indisponibles', 'Results unavailable')}</p>{hasFilters && <button className="text-link" onClick={() => { setQuery(''); setTypeDraft(''); navigate({ q: '', region: '', institution: '', institutionName: '', type: '', sector: '', apprenticeship: '', page: 1 }); }}>{tr('Réinitialiser les filtres', 'Reset filters')}</button>}</div>
    {hasFilters && <div className="catalogue-active-filters" aria-label={tr('Filtres actifs', 'Active filters')}>{[search, region, institutionName || institution, type, chosenSector === 'public' ? tr('Public', 'Public') : chosenSector === 'private' ? tr('Privé', 'Private') : '', apprenticeship === 'yes' ? tr('Apprentissage : oui', 'Apprenticeship: yes') : apprenticeship === 'no' ? tr('Apprentissage : non explicite', 'Apprenticeship: explicitly no') : ''].filter(Boolean).map((label, index) => <span key={index}>{label}</span>)}</div>}
    <div className="catalogue-view-options"><label>{tr('Afficher', 'Show')}<Select aria-label={tr('Afficher les formations', 'Show programmes')} value={onlySaved ? 'saved' : 'all'} onChange={event => navigate({ saved: event.target.value === 'saved', page: 1 })}><option value="all">{tr('Toutes les formations', 'All programmes')}</option><option value="saved">{t('Mes favoris')}</option></Select></label><div className="catalogue-view-switch" role="group" aria-label={tr('Vue des résultats', 'Results view')}><button aria-pressed={view === 'list'} onClick={() => navigate({ view: 'list' })}>{tr('Liste', 'List')}</button><button aria-pressed={view === 'map'} disabled={onlySaved} onClick={() => navigate({ view: 'map' })}>{tr('Carte', 'Map')}</button></div></div>
    {view === 'map' && !onlySaved && <><a className="text-link catalogue-skip" href="#catalogue-results" onClick={event => { event.preventDefault(); document.getElementById('catalogue-results')?.scrollIntoView(); }}>{tr('Aller aux résultats', 'Skip to results')}</a><Suspense fallback={<p role="status">{tr('Chargement de la carte…', 'Loading map…')}</p>}><FranceMap query={search} region={region} filters={{ type, sector: chosenSector, apprenticeship, institution }} onRegion={chooseRegion} onInstitution={establishment => navigate({ institution: establishment.code, institutionName: establishment.name, page: 1 })}/></Suspense></>}
    <section id="catalogue-results" className="catalogue-results" aria-label={tr('Résultats des formations', 'Programme results')}>
      {institution && <div className="institution-filter"><Icon name="school"/><span lang="fr">{institutionName || institution}</span><button className="text-link" onClick={() => navigate({ institution: '', institutionName: '', page: 1 })}><Icon name="close"/>{tr('Retirer ce filtre', 'Clear this filter')}</button></div>}
      <Source source={data?.source || null} year={data?.year}/><LoadState loading={request.loading} error={request.error} reload={request.reload}/>{action.feedback}
      {data && <>{data.failed > 0 && <div className="inline-error" role="alert">{tr('Certaines formations enregistrées sont indisponibles. Réessayez pour les actualiser.', 'Some saved programmes could not be loaded. Try again to refresh them.')}<button className="text-link" onClick={request.reload}>{t('Réessayer')}</button></div>}
        <div className="formation-grid">{data.results.map(f => <article className={'formation panel' + (compared.includes(f.id) ? ' is-compared' : '')} key={f.id}>
          <div className="formation-top"><span className="outline-token" lang="fr">{f.types.join(' / ')}</span><button className="favorite-button" disabled={action.busy || (!saved.includes(f.id) && saved.length >= 100)} aria-label={(saved.includes(f.id) ? tr('Retirer des favoris : ', 'Remove from favourites: ') : tr('Enregistrer : ', 'Save: ')) + f.name} aria-pressed={saved.includes(f.id)} onClick={() => void action.run(() => mutate('/saved', saved.includes(f.id) ? saved.filter(id => id !== f.id) : [...saved, f.id], 'PUT'), t('Favoris enregistrés.'))}><Icon name="heart"/></button></div>
          <h2 lang="fr">{f.name}</h2><p lang="fr">{f.institution}</p><div className="metadata"><span><Icon name="school"/>{f.city}</span><span>{f.region}</span><span>{sector(f.sector)}</span><span>{f.apprenticeship ? tr('Apprentissage', 'Apprenticeship') : f.apprenticeshipStatus === 'no' ? tr('Sans apprentissage (publié)', 'No apprenticeship (published)') : tr('Apprentissage non indiqué', 'Apprenticeship not indicated')}</span><span>{f.year}</span></div>
          <div className="formation-bottom"><label className="check-label" htmlFor={'compare-' + f.id}><Checkbox id={'compare-' + f.id} disabled={!compared.includes(f.id) && compared.length >= 4} checked={compared.includes(f.id)} onCheckedChange={checked => setCompared(checked === true ? [...compared, f.id] : compared.filter(id => id !== f.id))}/>{t('Comparer')}</label><a className="text-link" href={programmeHref(f.id, hash)} onClick={() => rememberCatalogue(hash)}>{tr('Voir la formation', 'View programme')}<Icon name="arrow"/></a></div>
          {onlySaved && <ProgrammePlanner programme={f} planner={planner} mutate={mutate}/>}
        </article>)}</div>
        {!data.results.length && <Empty title={onlySaved ? tr('Retrouvez vos pistes ici.', 'Find your shortlist here.') : tr('Aucune formation trouvée.', 'No programmes found.')} icon="search">{onlySaved && !saved.length ? tr('Enregistrez des formations avec le cœur pour les retrouver ici, puis ajoutez vos notes et vos prochaines étapes.', 'Use the heart to save programmes here, then add your notes and next steps.') : tr('Essayez un autre domaine, une ville ou retirez un filtre.', 'Try another subject, city or remove a filter.')}</Empty>}
        {pageCount > 1 && <nav className="catalogue-pagination" aria-label={tr('Pages du catalogue', 'Catalogue pages')}><button className="button" disabled={page <= 1} onClick={() => { navigate({ page: page - 1 }); document.getElementById('catalogue-results')?.scrollIntoView(); }}>{tr('Précédent', 'Previous')}</button><span>{tr('Page', 'Page')} {page} / {pageCount}</span><button className="button" disabled={page >= pageCount} onClick={() => { navigate({ page: page + 1 }); document.getElementById('catalogue-results')?.scrollIntoView(); }}>{tr('Suivant', 'Next')}</button></nav>}
        {data.total > 9984 && !onlySaved && <p className="subtle-notice">{tr('Affinez la recherche pour explorer au-delà des 9 984 premiers résultats accessibles par pagination.', 'Refine your search to explore beyond the first 9,984 results accessible through pagination.')}</p>}
        <p className="catalogue-caption">{tr('Les noms des formations et des établissements sont conservés dans leur langue officielle française.', 'Programme and institution names are kept in their official French wording.')}</p>
      </>}
    </section>
    {compared.length > 0 && <section className="comparison-tray" aria-label={tr('Sélection de formations', 'Selected programmes')}><div className="comparison-tray-heading"><strong>{compared.length} / 4 {tr('sélectionnées', 'selected')}</strong><small>{compared.length < 2 ? tr('Choisissez au moins deux formations pour comparer.', 'Choose at least two programmes to compare.') : tr('Quatre formations maximum.', 'Up to four programmes.')}</small><button className="text-link" onClick={() => setCompared([])}>{tr('Tout retirer', 'Clear all')}</button></div><div className="comparison-selections">{compared.map(id => { const f = cachedProgramme(id); return <button key={id} onClick={() => setCompared(compared.filter(value => value !== id))} aria-label={tr('Retirer : ', 'Remove: ') + (f ? f.name + ' · ' + f.institution : tr('Formation indisponible', 'Programme unavailable'))}><span><strong lang="fr">{f?.name || (selected.loading ? tr('Chargement de la formation…', 'Loading programme…') : tr('Formation indisponible', 'Programme unavailable'))}</strong>{f && <small lang="fr">{f.institution}</small>}</span><Icon name="close"/></button>; })}</div><button className="button" disabled={compared.length < 2} onClick={() => { rememberCatalogue(hash); location.hash = 'comparer?' + new URLSearchParams({ return: hash }); }}>{t('Comparer')}<Icon name="arrow"/></button>{selected.data?.failed ? <button className="text-link" onClick={selected.reload}>{tr('Actualiser les formations indisponibles', 'Refresh unavailable programmes')}</button> : null}</section>}
  </>;
}
