// Adapted from the dashboard-sidebar component supplied by the user.
import { useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import * as Select from '@radix-ui/react-select';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, LayoutDashboard, FolderKanban, FileText, Route, ClipboardCheck, Calendar, HelpCircle, School, GraduationCap, ChevronDown, ChevronRight, Check, UserRound, X, Command, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { t, tr } from '../../i18n';

export type NavItemData = { id: string; title: string; icon: ComponentType<{ size?: number; strokeWidth?: number }>; badge?: string | number; shortcut?: string; children?: NavItemData[] };
export type NavGroupData = { heading?: string; items: NavItemData[] };
const studentItems: NavItemData[] = [
  { id: 'accueil', title: 'Vue d’ensemble', icon: LayoutDashboard },
  { id: 'formations', title: 'Les formations', icon: Search },
  { id: 'dossier', title: 'Mon dossier', icon: FolderKanban },
  { id: 'cv', title: 'Mon CV', icon: FileText },
  { id: 'suivi', title: 'Mes candidatures', icon: Route },
  { id: 'decisions', title: 'Mes décisions', icon: ClipboardCheck },
];
const staffItems: NavItemData[] = [
  { id: 'admissions', title: 'Les candidatures', icon: FolderKanban },
  { id: 'remplacements', title: 'Les remplacements', icon: Calendar },
];
const help: NavItemData = { id: 'aide', title: 'Aide & repères', icon: HelpCircle };

function WorkspaceSwitcher({ staff, collapsed, onSelect }: { staff: boolean; collapsed: boolean; onSelect: (workspace: string) => void }) {
  const value = staff ? 'staff' : 'student';
  const SpaceIcon = staff ? School : GraduationCap;
  return <Select.Root value={value} onValueChange={next => { if (next !== value) onSelect(next); }}>
    <Select.Trigger className="workspace-switcher" aria-label={t('Mon espace')} title={collapsed ? t(staff ? 'Établissement' : 'Élève') : undefined}>
      <span className="workspace-symbol"><SpaceIcon size={19} strokeWidth={1.6}/></span>
      <span className="workspace-copy"><strong>{t(staff ? 'Établissement' : 'Élève')}</strong><small>{tr('Mon espace Déclic', 'My Déclic workspace')}</small></span>
      <Select.Icon><ChevronDown size={15}/></Select.Icon>
    </Select.Trigger>
    <Select.Portal><Select.Content className="select-content workspace-menu" position="popper" side={collapsed ? 'right' : 'bottom'} sideOffset={8} collisionPadding={12}>
      <Select.Viewport>{(['student', 'staff'] as const).map(option => <Select.Item className="select-option" value={option} key={option}>
        {option === 'student' ? <GraduationCap size={18}/> : <School size={18}/>}
        <Select.ItemText>{t(option === 'student' ? 'Élève' : 'Établissement')}</Select.ItemText><Select.ItemIndicator><Check size={16}/></Select.ItemIndicator>
      </Select.Item>)}</Select.Viewport>
    </Select.Content></Select.Portal>
  </Select.Root>;
}

function NavItem({ item, activeId, collapsed, level = 0 }: { item: NavItemData; activeId: string; collapsed: boolean; level?: number }) {
  const [open, setOpen] = useState(false);
  const Icon = item.icon;
  const content = <><Icon size={18} strokeWidth={1.6}/><span className="sidebar-item-label">{t(item.title)}</span>{item.badge !== undefined && <span className="sidebar-badge">{item.badge}</span>}{item.children && <ChevronRight size={14} className={open ? 'turned' : ''}/>}</>;
  const classes = 'dashboard-nav-item' + (activeId === item.id ? ' active' : '');
  return <div className="dashboard-nav-entry" style={{ '--nav-level': level } as CSSProperties}>
    {item.children ? <button type="button" className={classes} aria-expanded={open} onClick={() => setOpen(v => !v)} title={collapsed ? t(item.title) : undefined}>{content}</button> : <a href={'#' + item.id} className={classes} aria-current={activeId === item.id ? 'page' : undefined} aria-label={collapsed ? t(item.title) : undefined} title={collapsed ? t(item.title) : undefined}>{content}</a>}
    {item.children && <div className={'sidebar-children' + (open ? ' expanded' : '')} inert={!open}><div>{item.children.map(child => <NavItem key={child.id} item={child} activeId={activeId} collapsed={collapsed} level={level + 1}/>)}</div></div>}
  </div>;
}

export function SidebarNav({ activeId, staff, menu, collapsed, onWorkspaceSelect, onClose, onCollapse, profile }: { activeId: string; staff: boolean; menu: boolean; collapsed: boolean; onWorkspaceSelect: (value: string) => void; onClose: () => void; onCollapse: () => void; profile?: { firstname: string; lastname: string; school: string } }) {
  const [searchOpen, setSearchOpen] = useState(false), [query, setQuery] = useState('');
  const sidebar = useRef<HTMLElement>(null);
  const items = staff ? staffItems : studentItems;
  const groups: NavGroupData[] = staff ? [{ items }, { items: [help] }] : [{ items: studentItems.slice(0, 2) }, { heading: tr('Préparer', 'Prepare'), items: studentItems.slice(2, 4) }, { heading: tr('Suivre', 'Follow up'), items: studentItems.slice(4) }, { items: [help] }];
  const name = [profile?.firstname, profile?.lastname].filter(Boolean).join(' ') || tr('Votre profil', 'Your profile');
  useEffect(() => {
    if (!menu) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const background = [document.querySelector<HTMLElement>('.shell'), document.querySelector<HTMLElement>('.language-switch')].filter((element): element is HTMLElement => !!element);
    const previousInert = background.map(element => element.inert);
    const previousOverflow = document.body.style.overflow;
    background.forEach(element => { element.inert = true; });
    document.body.style.overflow = 'hidden';
    const focusFrame = requestAnimationFrame(() => sidebar.current?.querySelector<HTMLButtonElement>('.sidebar-mobile-close')?.focus({ preventScroll: true }));
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || event.defaultPrevented || !sidebar.current?.contains(event.target as Node)) return;
      const controls = [...sidebar.current.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),[tabindex="0"]')].filter(element => element.getClientRects().length > 0 && !element.closest('[inert]'));
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', trapFocus);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', trapFocus);
      background.forEach((element, index) => { element.inert = previousInert[index]; });
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [menu]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(v => !v); } };
    document.addEventListener('keydown', shortcut); return () => document.removeEventListener('keydown', shortcut);
  }, []);
  const normalized = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const matches = [...items, help].filter(item => normalized(t(item.title)).includes(normalized(query)));
  return <>
    {menu && <button className="sidebar-backdrop" aria-label={tr('Fermer la navigation', 'Close navigation')} onClick={onClose}/>}
    <aside ref={sidebar} id="sidebar" className={'sidebar dashboard-sidebar' + (menu ? ' open' : '')} role={menu ? 'dialog' : undefined} aria-modal={menu ? true : undefined} aria-label={tr('Navigation Déclic', 'Déclic navigation')}>
      <div className="dashboard-brand-row"><a className="brand" href="#accueil" aria-label={t('Déclic, accueil')}><span className="brand-symbol" aria-hidden="true"><School size={22} strokeWidth={1.5}/></span><span className="sidebar-brand-name">déclic<span className="brand-dot">.</span></span></a><button type="button" className="sidebar-collapse" onClick={onCollapse} aria-label={collapsed ? tr('Déplier la barre latérale', 'Expand sidebar') : tr('Réduire la barre latérale', 'Collapse sidebar')} aria-expanded={!collapsed} aria-controls="navigation">{collapsed ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}</button><button type="button" className="sidebar-mobile-close" onClick={onClose} aria-label={tr('Fermer la navigation', 'Close navigation')}><X size={18}/></button></div>
      <WorkspaceSwitcher staff={staff} collapsed={collapsed} onSelect={onWorkspaceSelect}/>
      <Dialog.Root open={searchOpen} onOpenChange={open => { setSearchOpen(open); if (!open) setQuery(''); }}>
        <Dialog.Trigger className="sidebar-search" title={tr('Rechercher une page', 'Find a page')}><Search size={17}/><span className="sidebar-item-label">{tr('Rechercher', 'Search')}</span><kbd>Ctrl K</kbd></Dialog.Trigger>
        <Dialog.Portal><Dialog.Overlay className="navigation-search-overlay"/><Dialog.Content className="navigation-search-dialog" aria-describedby={undefined}>
          <Dialog.Title className="visually-hidden">{tr('Rechercher une page', 'Find a page')}</Dialog.Title>
          <div className="navigation-search-input"><Search size={19}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder={tr('Rechercher une page…', 'Find a page…')} aria-label={tr('Rechercher une page', 'Find a page')}/><Dialog.Close aria-label={tr('Fermer', 'Close')}><X size={18}/></Dialog.Close></div>
          <div className="navigation-search-results">{matches.map(item => <Dialog.Close asChild key={item.id}><a href={'#' + item.id}><item.icon size={18}/><span>{t(item.title)}</span><ChevronRight size={15}/></a></Dialog.Close>)}{!matches.length && <p>{tr('Aucune page trouvée. Essayez « CV » ou « formations ».', 'No pages found. Try “CV” or “programmes”.')}</p>}</div>
          <div className="navigation-search-footer"><Command size={14}/>{tr('Un raccourci vers votre prochain pas.', 'A shortcut to your next step.')}</div>
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>
      <nav id="navigation" aria-label={t('Navigation principale')} className="dashboard-navigation">{groups.map((group, index) => <div className="dashboard-nav-group" key={index}>{group.heading && <p className="dashboard-nav-heading">{t(group.heading)}</p>}{group.items.map(item => <NavItem key={item.id} item={item} activeId={activeId === 'formation' || activeId === 'comparer' ? 'formations' : activeId} collapsed={collapsed}/>)}</div>)}</nav>
      <div className="dashboard-sidebar-footer"><a className="sidebar-profile" href="#dossier" aria-label={t('Ouvrir mon profil')}><span className="sidebar-profile-avatar"><UserRound size={19}/></span><span className="sidebar-profile-copy"><strong>{name}</strong><small>{profile?.school || tr('Votre établissement', 'Your institution')}</small></span><ChevronRight size={15}/></a></div>
    </aside>
  </>;
}
