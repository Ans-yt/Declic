import { useRef, useState, type InputHTMLAttributes } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { DayPicker } from 'react-day-picker';
import { enGB, fr } from 'react-day-picker/locale';
import { getLanguage, tr } from '../i18n';
import 'react-day-picker/style.css';
export function dateValue(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function parseDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined; const [year, month, day] = value.split('-').map(Number); const date = new Date(year, month - 1, day, 12); return dateValue(date) === value ? date : undefined; }
export default function DateInput({ value, onValueChange, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & { value: string; onValueChange: (value: string) => void }) {
  const [open, setOpen] = useState(false), selected = parseDate(value);
  const trigger = useRef<HTMLButtonElement>(null);
  const calendar = useRef<HTMLDivElement>(null);
  const locale = getLanguage() === 'fr' ? fr : enGB;
  return <Popover.Root open={open} onOpenChange={setOpen}>
    <input {...props} id={undefined} type="date" value={value} className="date-validation" tabIndex={-1} aria-label={tr('Date sélectionnée', 'Selected date')} onChange={event => onValueChange(event.target.value)} onInvalid={event => { event.preventDefault(); trigger.current?.focus(); setOpen(true); }}/>
    <Popover.Trigger ref={trigger} id={props.id} className="date-trigger" disabled={props.disabled} aria-required={props.required} aria-label={props['aria-label']}>
      <span>{selected ? selected.toLocaleDateString(getLanguage() === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : tr('Choisir une date', 'Choose a date')}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18"/></svg>
    </Popover.Trigger>
    <Popover.Portal><Popover.Content ref={calendar} className="calendar-popover" align="start" sideOffset={8} collisionPadding={12} onOpenAutoFocus={event => { event.preventDefault(); requestAnimationFrame(() => { const day = calendar.current?.querySelector<HTMLButtonElement>('.rdp-day_button[tabindex="0"], .rdp-selected .rdp-day_button') || calendar.current?.querySelector<HTMLButtonElement>('.rdp-day_button:not([disabled])'); day?.focus({ preventScroll: true }); }); }} onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus({ preventScroll: true }); }} aria-label={tr('Choisir une date', 'Choose a date')}>
      <DayPicker mode="single" locale={locale} selected={selected} defaultMonth={selected} showOutsideDays disabled={[...(props.min ? [{ before: parseDate(String(props.min))! }] : []), ...(props.max ? [{ after: parseDate(String(props.max))! }] : [])]} onSelect={date => { if (date) { onValueChange(dateValue(date)); setOpen(false); } }}/>
      <div className="calendar-actions"><button type="button" disabled={props.required || !value} onClick={() => { onValueChange(''); setOpen(false); }}>{tr('Effacer', 'Clear')}</button><Popover.Close>{tr('Fermer', 'Close')}</Popover.Close></div>
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}
