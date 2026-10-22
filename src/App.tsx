import { LoadingIndicator } from './components/Controls';
import { SidebarNav } from './components/ui/dashboard-sidebar';
import { t, tr, useLanguage, setLanguage } from "./i18n";
import { useEffect, useRef, useState } from 'react';
import { cvDraftSchema, profileDraftSchema, type Workspace } from '../shared/models';
import { useRecoverableDraft } from './lib/drafts';
import { useComparison } from './lib/comparison';
import { ProfessionalOverview, GuidedDemo } from './ProfessionalOverview';
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
const currentRoute = () => location.hash.slice(1).split('?')[0].split('/')[0] || 'connexion';
export default function App() {
  const [loaded, setLoaded] = useState<{data: Workspace; auth: AuthState} | null>(null);
  const [error, setError] = useState(''), [revision, setRevision] = useState(0), [backupRestored, setBackupRestored] = useState(false);
  useLanguage();
  async function load() {
    setError('');
    try { const [data, auth] = await Promise.all([api('/workspace'), api<AuthState>('/auth/session')]); setLoaded({data,auth}); setRevision(v => v + 1); }
    catch (e) { setError(e instanceof Error ? e.message : t('Le serveur ne répond pas.')); }
  }
  useEffect(() => { void load(); }, []);
  if (error) return <main className="screen-error"><h1>{t('Retrouvons votre espace.')}</h1><p role="alert">{error}</p><button className="button" onClick={() => void load()}>{t('Réessayer')}</button></main>;
  if (!loaded) return <main className="app-loading"><LoadingIndicator label={t('Chargement de votre espace…')}/></main>;
  return <WorkspaceApp key={loaded.data.draftKey + ':' + revision} initialData={loaded.data} initialAuth={loaded.auth} backupRestored={backupRestored} reload={async () => { await load(); setBackupRestored(true); }}/>;
}
function WorkspaceApp({initialData, initialAuth, reload, backupRestored}: {initialData: Workspace; initialAuth: AuthState; reload:()=>Promise<void>; backupRestored:boolean}) {
  const language = useLanguage();
  const [route, setRoute] = useState(currentRoute),
    [role, setRole] = useState('student'),
    [menu, setMenu] = useState(false),
    [collapsed, setCollapsed] = useState(false),
    [data, setData] = useState<Workspace>(initialData);
  const profileDraft = useRecoverableDraft('declic:profile:' + data.draftKey, data.profile, value => { const parsed = profileDraftSchema.safeParse(value); return parsed.success ? parsed.data : null; });
  const cvDraft = useRecoverableDraft('declic:cv:' + data.draftKey, data.cv, value => { const parsed = cvDraftSchema.safeParse(value); return parsed.success ? parsed.data : null; });
  const cv = cvDraft.draft, setCV = cvDraft.setDraft;
  const [compared, setCompared] = useComparison(data.draftKey);
  const [auth, setAuth] = useState<AuthState | null>(initialAuth);
  const mainRef = useRef<HTMLElement>(null),
    menuRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const change = () => {
      setRoute(currentRoute());
      setMenu(false);
      requestAnimationFrame(() => {
        mainRef.current?.focus();
        if (currentRoute() !== 'formations') window.scrollTo(0, 0);
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
      if (cvDraft.dirty || profileDraft.dirty) {
        event.preventDefault();
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [cvDraft.dirty, profileDraft.dirty]);
  async function refreshAuth() { const [session, workspace] = await Promise.all([api<AuthState>('/auth/session'), api('/workspace')]); setAuth(session); setData(workspace); }
  useEffect(() => { const required = () => { setAuth(a => a ? { ...a, staff: null } : a); }; window.addEventListener('declic:authrequired', required); return () => window.removeEventListener('declic:authrequired', required); }, []);
  async function mutate(path: string, body: unknown, method = 'POST') {
    const updated = await api(path, method, body);
    setData(updated);
  }
  const staff = ['admissions', 'remplacements'].includes(route) || route === 'aide' && role === 'staff';
  function page() {
    switch (route) {
      case 'connexion':
        return <Welcome data={data} mutate={mutate} setCV={setCV} />;
      case 'accueil':
        return <Home cv={cv} />;
      case 'cv':
        return <CVEditor cv={cv} savedCV={data.cv} setCV={setCV} profile={data.profile} recovered={cvDraft.recovered} save={v => mutate('/cv', v, 'PUT')} />;
      case 'dossier':
        return <>{backupRestored && <p className="draft-recovery" role="status">{tr('Sauvegarde importée. Votre espace personnel a été restauré ; les données professionnelles sont conservées.', 'Backup imported. Your personal workspace has been restored; professional records are unchanged.')}</p>}<ProfilePage profile={data.profile} draft={profileDraft.draft} setDraft={profileDraft.setDraft} recovered={profileDraft.recovered} hasUnsavedWork={profileDraft.dirty || cvDraft.dirty} onBackupImported={async () => {profileDraft.clearDraft(); cvDraft.clearDraft(); await reload();}} save={v => mutate('/profile', v, 'PUT')} /></>;
      case 'formations':
        return <Formations saved={data.saved} planner={data.planner} mutate={mutate} compared={compared} setCompared={setCompared} />;
      case 'formation':
        return <Formation />;
      case 'comparer':
        return <Compare ids={compared} />;
      case 'suivi':
        return <Applications applications={data.applications} />;
      case 'decisions':
        return <Decisions applications={data.applications} mutate={mutate} />;
      case 'admissions':
        return <StaffAccess auth={auth} refresh={refreshAuth}><ProfessionalOverview data={data}/><GuidedDemo data={data} mutate={mutate}/><Admissions applications={data.applications} mutate={mutate} /></StaffAccess>;
      case 'remplacements':
        return <StaffAccess auth={auth} refresh={refreshAuth}><ProfessionalOverview data={data}/><Replacements needs={data.needs} candidates={data.candidates} mutate={mutate} /></StaffAccess>;
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
