import { DateInput, LoadingIndicator } from './components/Controls';
import { t } from "./i18n";
import { useId, useState, useRef, type ReactNode, type InputHTMLAttributes } from 'react';
const paths: Record<string, ReactNode> = {
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" />,
  home: <><path d="m3 10 9-7 9 7v11H3z" /><path d="M9 21v-8h6v8" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  folder: <path d="M3 7V4h6l3 3h9v14H3z" />,
  route: <><circle cx="5" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><path d="M7 5h8a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h8" /></>,
  file: <path d="M5 3h9l5 5v13H5zM14 3v6h5M9 13h6M9 17h6" />,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9 9a3 3 0 1 1 4 3c-1 0-1 1-1 2M12 17h.01" /></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 11h18" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  plus: <path d="M12 4v16M4 12h16" />,
  back: <path d="M20 12H4m6-6-6 6 6 6" />,
  print: <><path d="M6 8V3h12v5M6 17H3V9h18v8h-3M6 14h12v7H6zM17 11h1" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  school: <path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7" />,
  spark: <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z" />,
  compare: <path d="M8 3v18M16 3v18M3 7h10M11 17h10" />
  ,locate: <><circle cx="12" cy="12" r="6"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></>,
  upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/></>,
  award: <><circle cx="12" cy="8" r="5"/><path d="m8 12-2 10 6-3 6 3-2-10"/></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/></>
  ,globe: <><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></>
};
export function Icon({
  name
}: {
  name: string;
}) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name] || paths.file}</svg>;
}
export function Placeholder({
  children
}: {
  children: ReactNode;
}) {
  return <span className="placeholder">{typeof children === 'string' ? children.replace(/^\*|\*$/g, '').trim() : children}</span>;
}
export function Heading({
  title,
  children,
  action
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return <div className="page-heading"><div><h1>{t(title)}</h1><p>{children}</p></div>{action}</div>;
}
export function LinkButton({
  to,
  children
}: {
  to: string;
  children: ReactNode;
}) {
  return <a className="button" href={'#' + to}>{children}<Icon name="arrow" /></a>;
}
export function Field({
  label,
  value,
  onChange,
  multiline = false,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  const id = useId();
  const placeholder = props.placeholder ? t(props.placeholder).replace(/^\*|\*$/g, '').trim() : undefined;
  return <label className="field" htmlFor={id}>{t(label)}{multiline ? <textarea id={id} value={value} onChange={e => onChange(e.target.value)} rows={4} maxLength={6000} placeholder={placeholder} required={props.required} /> : props.type === 'date' ? <DateInput {...props} id={id} value={value} onValueChange={onChange}/> : <input id={id} value={value} onChange={e => onChange(e.target.value)} maxLength={300} {...props} placeholder={placeholder} />}</label>;
}
export function Empty({
  title,
  children,
  action,
  icon = 'folder'
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  icon?: string;
}) {
  return <div className="desk-empty"><Icon name={icon} /><h2>{t(title)}</h2><p>{children}</p>{action}</div>;
}
export function Sticker({
  name,
  className = ''
}: {
  name: string;
  className?: string;
}) {
  return <img src={`/assets/stickers/sticker_${name}.png`} className={'sticker ' + className} width="512" height="512" alt="" aria-hidden="true" />;
}
export function Notebook({
  variant = 'generated'
}: {
  variant?: 'generated' | 'kit';
}) {
  return <div className={'notebook-art notebook-' + variant}><img className="main-illustration" src={variant === 'kit' ? '/assets/illustrations/notebook-kit.png' : '/assets/notebook-illustration.png'} alt={t("Carnet brun, étoile orange et crayons sur un fond crème.")} />{variant === 'generated' && <><Sticker name="star" className="sticker-notebook-star" /><Sticker name="lightning" className="sticker-notebook-lightning" /></>}</div>;
}
export function Workflow({
  steps,
  current
}: {
  steps: string[];
  current: number;
}) {
  return <ol className="workflow" aria-label={t("Avancement")}>{steps.map((label, index) => <li key={label} className={index < current ? 'done' : index === current ? 'current' : ''} aria-current={index === current ? 'step' : undefined}><span className="workflow-node">{index < current ? <Icon name="check" /> : <span />}</span><strong>{t(label)}</strong></li>)}</ol>;
}
export function useAction() {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  async function run(work: () => Promise<void>, success = t('Enregistré.')) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await work();
      setMessage(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Une erreur est survenue. Réessayez.'));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return {
    busy,
    run,
    feedback: <>{busy && <LoadingIndicator inline label={t('Enregistrement…')}/>} {error && <div className="inline-error" role="alert">{t(error)}</div>}<p className="save-feedback" role="status">{t(message)}</p></>
  };
}
