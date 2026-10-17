import { useEffect, useRef, useState } from 'react';
import { blankCV, type CV, type Workspace } from '../shared/models';
import { api } from './api';
import { Home } from './Home';
import { Decisions } from './Decisions';
import { Formations, Compare } from './FormationExplorer';
import { Icon } from './ui';
import { CVEditor } from './CVEditor';
import { Admissions } from './Admissions';
import { Replacements } from './Replacements';
import { Applications, Formation, Help, ProfilePage, Welcome } from './StudentPages';

const routes: Record<string, string> = { connexion: 'Bienvenue', cv: 'Mon CV', accueil: 'Vue d’ensemble', formations: 'Explorer les formations', dossier: 'Mon dossier', suivi: 'Mes candidatures', decisions: 'Comprendre mes décisions', aide: 'Aide & repères', admissions: 'Étudier les candidatures', remplacements: 'Organiser les remplacements', formation: 'Fiche formation', comparer: 'Comparer les formations' };
const studentLinks = [['accueil', 'home', 'Vue d’ensemble'], ['formations', 'search', 'Les formations'], ['dossier', 'folder', 'Mon dossier'], ['cv', 'file', 'Mon CV'], ['suivi', 'route', 'Mes candidatures'], ['decisions', 'file', 'Mes décisions']];
const staffLinks = [['admissions', 'folder', 'Les candidatures'], ['remplacements', 'calendar', 'Les remplacements']];
const currentRoute = () => location.hash.slice(1).split('/')[0] || 'connexion';
export default function App() {
  const [route, setRoute] = useState(currentRoute), [role, setRole] = useState('student'), [menu, setMenu] = useState(false), [data, setData] = useState<Workspace | null>(null), [error, setError] = useState(''), [cv, setCV] = useState<CV>(blankCV), [compared, setCompared] = useState<number[]>([]);
  const mainRef = useRef<HTMLElement>(null), menuRef = useRef<HTMLButtonElement>(null);
  async function load() { setError(''); try { const workspace = await api('/workspace'); setData(workspace); setCV(workspace.cv); } catch (e) { setError(e instanceof Error ? e.message : 'Le serveur ne répond pas.'); } }
  useEffect(() => { void load(); const change = () => { setRoute(currentRoute()); setMenu(false); requestAnimationFrame(() => { mainRef.current?.focus(); window.scrollTo(0, 0); }); }; window.addEventListener('hashchange', change); return () => window.removeEventListener('hashchange', change); }, []);
  useEffect(() => { if (['admissions', 'remplacements'].includes(route)) setRole('staff'); else if (route !== 'aide') setRole('student'); document.title = 'Déclic — ' + (routes[route] || 'Page introuvable'); document.body.classList.toggle('entry-mode', route === 'connexion'); }, [route]);
  useEffect(() => { const escape = (e: KeyboardEvent) => { if (e.key === 'Escape' && menu) { setMenu(false); menuRef.current?.focus(); } }; document.addEventListener('keydown', escape); return () => document.removeEventListener('keydown', escape); }, [menu]);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (data && JSON.stringify(cv) !== JSON.stringify(data.cv)) { event.preventDefault(); } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [cv, data]);
  async function mutate(path: string, body: unknown, method = 'POST') { const updated = await api(path, method, body); setData(updated); }
  const staff = ['admissions', 'remplacements'].includes(route) || (route === 'aide' && role === 'staff');
  function page() {
    if (error) return <section className="screen-error" role="alert"><h1>Retrouvons votre espace.</h1><p>{error}</p><button className="button" onClick={() => void load()}>Réessayer</button></section>;
    if (!data) return <p className="app-loading" role="status">Chargement de votre espace…</p>;
    switch (route) {
      case 'connexion': return <Welcome data={data} mutate={mutate} setCV={setCV}/>;
      case 'accueil': return <Home cv={cv}/>;
      case 'cv': return <CVEditor cv={cv} savedCV={data.cv} setCV={setCV} profile={data.profile} save={v => mutate('/cv', v, 'PUT')}/>;
      case 'dossier': return <ProfilePage profile={data.profile} save={v => mutate('/profile', v, 'PUT')}/>;
      case 'formations': return <Formations saved={data.saved} mutate={mutate} compared={compared} setCompared={setCompared}/>;
      case 'formation': return <Formation/>;
      case 'comparer': return <Compare ids={compared}/>;
      case 'suivi': return <Applications applications={data.applications}/>;
      case 'decisions': return <Decisions applications={data.applications} mutate={mutate}/>;
      case 'admissions': return <Admissions applications={data.applications} mutate={mutate}/>;
      case 'remplacements': return <Replacements needs={data.needs} candidates={data.candidates} mutate={mutate}/>;
      case 'aide': return <Help/>;
      default: return <section className="screen-error"><h1>Cette page reste à trouver.</h1><a className="button" href="#accueil">Retour à l’accueil</a></section>;
    }
  }
  return <><a className="skip-link" href="#main" onClick={e => { e.preventDefault(); mainRef.current?.focus(); }}>Aller au contenu</a><aside className={'sidebar' + (menu ? ' open' : '')} id="sidebar"><a className="brand" href="#accueil" aria-label="Déclic, accueil"><span className="brand-symbol" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M6 25V12L16 5l10 7v13M11 25V15l5-4 5 4v10M16 17v8"/></svg></span>déclic<span className="brand-dot">.</span></a><div className="space-label">L’orientation, à votre rythme.</div><label className="role-label" htmlFor="role">Mon espace</label><select id="role" value={staff ? 'staff' : 'student'} onChange={e => { setRole(e.target.value); location.hash = e.target.value === 'staff' ? 'admissions' : 'accueil'; }}><option value="student">Élève</option><option value="staff">Établissement</option></select><nav id="navigation" aria-label="Navigation principale">{(staff ? staffLinks : studentLinks).map(([key, icon, label]) => <a key={key} className={'nav-link' + (route === key ? ' active' : '')} href={'#' + key} aria-current={route === key ? 'page' : undefined}><Icon name={icon}/>{label}</a>)}<div className="nav-caption">Pour vous accompagner</div><a className={'nav-link' + (route === 'aide' ? ' active' : '')} href="#aide" aria-current={route === 'aide' ? 'page' : undefined}><Icon name="help"/>Aide & repères</a></nav><div className="sidebar-bottom"><a href="#aide" className="help-link"><Icon name="help"/>Besoin d’un repère ?<span aria-hidden="true">↗</span></a><div className="profile"><span className="avatar" aria-hidden="true"><Icon name="user"/></span><div><span className="placeholder">*Votre prénom*</span><small>*Votre établissement*</small></div><a href="#dossier" aria-label="Ouvrir mon profil"><Icon name="arrow"/></a></div></div></aside><div className="shell"><header className="topbar"><button ref={menuRef} id="menu-toggle" className="icon-button mobile-only" aria-label={menu ? 'Fermer la navigation' : 'Ouvrir la navigation'} aria-expanded={menu} aria-controls="sidebar" onClick={() => setMenu(!menu)}><Icon name="menu"/></button><div className="breadcrumb">Mon espace<span>/</span><span>{routes[route] || 'Page introuvable'}</span></div><div className="prototype-label"><span/>Démonstration locale</div></header><main id="main" className={"route-" + route} tabIndex={-1} ref={mainRef}>{page()}</main><footer>Déclic<span>Un peu plus clair, un pas à la fois.</span><span>Démonstration · Données fictives uniquement</span></footer></div></>;
}

