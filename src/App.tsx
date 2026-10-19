import { LoadingIndicator } from './components/Controls';
import { SidebarNav } from './components/ui/dashboard-sidebar';
import { t, useLanguage, setLanguage } from "./i18n";
import { useEffect, useRef, useState } from 'react';
import { blankCV, type CV, type Workspace } from '../shared/models';
import { api } from './api';
import { Home } from './Home';
import { Decisions } from './Decisions';
import { Compare, Formation } from './FormationExplorer';
import { Formations } from './FormationsPage';
import { Icon } from './ui';
import { StaffAccess } from './StaffAccess';
import type { AuthState } from '../shared/auth';
import { CVEditor } from './CVEditor';
import { Admissions } from './Admissions';
import { Replacements } from './Replacements';
import { Applications, Help, ProfilePage, Welcome } from './StudentPages';
const routes: Record<string, string> = {
  connexion: 'Bienvenue',
  cv: 'Mon CV',
  accueil: 'Vue d’ensemble',
  formations: 'Explorer les formations',
  dossier: 'Mon dossier',
  suivi: 'Mes candidatures',
  decisions: 'Comprendre mes décisions',
  aide: 'Aide & repères',
  admissions: 'Étudier les candidatures',
  remplacements: 'Organiser les remplacements',
  formation: 'Fiche formation',
  comparer: 'Comparer les formations'
};
const currentRoute = () => location.hash.slice(1).split('/')[0] || 'connexion';
export default function App() {
  const language = useLanguage();
  const [route, setRoute] = useState(currentRoute),
    [role, setRole] = useState('student'),
    [menu, setMenu] = useState(false),
    [collapsed, setCollapsed] = useState(false),
    [data, setData] = useState<Workspace | null>(null),
    [error, setError] = useState(''),
    [cv, setCV] = useState<CV>(blankCV),
    [compared, setCompared] = useState<string[]>([]);
  const [auth, setAuth] = useState<AuthState | null>(null);
  const mainRef = useRef<HTMLElement>(null),
    menuRef = useRef<HTMLButtonElement>(null);
  async function load() {
    setError('');
    try {
      const workspace = await api('/workspace');
      const session = await api<AuthState>('/auth/session');
      setAuth(session);
      setData(workspace);
      setCV(workspace.cv);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Le serveur ne répond pas.'));
    }
  }
  useEffect(() => {
    void load();
    const change = () => {
      setRoute(currentRoute());
      setMenu(false);
      requestAnimationFrame(() => {
        mainRef.current?.focus();
        window.scrollTo(0, 0);
      });
    };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    if (['admissions', 'remplacements'].includes(route)) setRole('staff');else if (route !== 'aide') setRole('student');
    document.title = 'Déclic — ' + t(routes[route] || 'Page introuvable');
    document.documentElement.lang = language;
    document.body.classList.toggle('entry-mode', route === 'connexion');
  }, [route, language]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menu) {
        setMenu(false);
        menuRef.current?.focus();
      }
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [menu]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (data && JSON.stringify(cv) !== JSON.stringify(data.cv)) {
        event.preventDefault();
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [cv, data]);
  async function refreshAuth() { const [session, workspace] = await Promise.all([api<AuthState>('/auth/session'), api('/workspace')]); setAuth(session); setData(workspace); }
  useEffect(() => { const required = () => { setAuth(a => a ? { ...a, staff: null } : a); }; window.addEventListener('declic:authrequired', required); return () => window.removeEventListener('declic:authrequired', required); }, []);
  async function mutate(path: string, body: unknown, method = 'POST') {
    const updated = await api(path, method, body);
    setData(updated);
  }
  const staff = ['admissions', 'remplacements'].includes(route) || route === 'aide' && role === 'staff';
  function page() {
    if (error) return <section className="screen-error" role="alert"><h1>{t("Retrouvons votre espace.")}</h1><p>{error}</p><button className="button" onClick={() => void load()}>{t("Réessayer")}</button></section>;
    if (!data) return <div className="app-loading"><LoadingIndicator label={t("Chargement de votre espace…")}/></div>;
    switch (route) {
      case 'connexion':
        return <Welcome data={data} mutate={mutate} setCV={setCV} />;
      case 'accueil':
        return <Home cv={cv} />;
      case 'cv':
        return <CVEditor cv={cv} savedCV={data.cv} setCV={setCV} profile={data.profile} save={v => mutate('/cv', v, 'PUT')} />;
      case 'dossier':
        return <ProfilePage profile={data.profile} save={v => mutate('/profile', v, 'PUT')} />;
      case 'formations':
        return <Formations saved={data.saved} mutate={mutate} compared={compared} setCompared={setCompared} />;
      case 'formation':
        return <Formation />;
      case 'comparer':
        return <Compare ids={compared} />;
      case 'suivi':
        return <Applications applications={data.applications} />;
      case 'decisions':
        return <Decisions applications={data.applications} mutate={mutate} />;
      case 'admissions':
        return <StaffAccess auth={auth} refresh={refreshAuth}><Admissions applications={data.applications} mutate={mutate} /></StaffAccess>;
      case 'remplacements':
        return <StaffAccess auth={auth} refresh={refreshAuth}><Replacements needs={data.needs} candidates={data.candidates} mutate={mutate} /></StaffAccess>;
      case 'aide':
        return <Help />;
      default:
        return <section className="screen-error"><h1>{t("Cette page reste à trouver.")}</h1><a className="button" href="#accueil">{t("Retour à l’accueil")}</a></section>;
    }
  }
  return <>
    <div className="language-switch" data-language={language} role="group" aria-label={t('Langue')}><span className="language-slider" aria-hidden="true"/><button type="button" lang="fr" onClick={() => setLanguage('fr')} aria-pressed={language === 'fr'} title="Passer en français">FR</button><button type="button" lang="en" onClick={() => setLanguage('en')} aria-pressed={language === 'en'} title="Switch to English">EN</button></div>
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); mainRef.current?.focus(); }}>{t('Aller au contenu')}</a>
    <div className={'app-frame' + (collapsed ? ' sidebar-collapsed' : '')}>
      <SidebarNav activeId={route} staff={staff} menu={menu} collapsed={collapsed} profile={data?.profile} onClose={() => { setMenu(false); menuRef.current?.focus(); }} onCollapse={() => setCollapsed(value => !value)} onWorkspaceSelect={value => { setRole(value); location.hash = value === 'staff' ? 'admissions' : 'accueil'; }}/>
      <div className="shell"><header className="topbar"><button ref={menuRef} id="menu-toggle" className="icon-button mobile-only" aria-label={menu ? t('Fermer la navigation') : t('Ouvrir la navigation')} aria-expanded={menu} aria-controls="sidebar" onClick={() => setMenu(!menu)}><Icon name="menu"/></button><div className="breadcrumb">{t('Mon espace')}<span>/</span><span>{t(routes[route] || 'Page introuvable')}</span></div><div className="prototype-label"><span/>{t('Données publiques & espace démo')}</div></header><main id="main" className={'route-' + route} tabIndex={-1} ref={mainRef}>{page()}</main><footer>{t('Déclic')}<span>{t('Un peu plus clair, un pas à la fois.')}</span><span>{t('Catalogue officiel · Dossiers de démonstration')}</span></footer></div>
    </div>
  </>;
}
