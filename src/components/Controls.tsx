import { Children, isValidElement, lazy, Suspense, useId, useRef, useState, type ReactNode, type SelectHTMLAttributes, type InputHTMLAttributes, type CSSProperties } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { getLanguage, tr } from '../i18n';

const Chevron = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>;
const Check = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>;

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value' | 'defaultValue'> & { value: string; onChange: (event: { target: { value: string } }) => void };
/** A selectable list, with the supplied dropdown's motion and Radix keyboard/focus handling. */
export function Select({ value, onChange, children, id, className = '', disabled, required, name, ...props }: SelectProps) {
  const automaticId = useId();
  const options = Children.toArray(children).filter(isValidElement).map(child => {
    const p = (child as { props: { value?: string; children?: ReactNode; disabled?: boolean } }).props;
    return { value: p.value ?? String(p.children), label: p.children, disabled: p.disabled };
  });
  const sentinel = '__declic_empty__';
  return <SelectPrimitive.Root value={value} onValueChange={next => onChange({ target: { value: next === sentinel ? '' : next } })} disabled={disabled} required={required} name={name}>
    <SelectPrimitive.Trigger id={id || automaticId} className={'select-trigger ' + className} aria-label={props['aria-label']} aria-labelledby={props['aria-labelledby']} aria-describedby={props['aria-describedby']} aria-invalid={props['aria-invalid']}>
      <SelectPrimitive.Value placeholder={options.find(option => option.value === '')?.label}/><SelectPrimitive.Icon className="select-chevron"><Chevron/></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal><SelectPrimitive.Content className="select-content" position="popper" sideOffset={7} collisionPadding={12}>
      <SelectPrimitive.ScrollUpButton className="select-scroll"><Chevron/></SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport className="select-viewport">{options.map(option => <SelectPrimitive.Item className="select-option" value={option.value || sentinel} key={option.value} disabled={option.disabled}>
        <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText><SelectPrimitive.ItemIndicator><Check/></SelectPrimitive.ItemIndicator>
      </SelectPrimitive.Item>)}</SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="select-scroll"><Chevron/></SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content></SelectPrimitive.Portal>
  </SelectPrimitive.Root>;
}

const CalendarInput = lazy(() => import('./DateInput'));
export function DateInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & { value: string; onValueChange: (value: string) => void }) {
  const { onValueChange, ...native } = props;
  return <Suspense fallback={<input {...native} type="date" onChange={event => onValueChange(event.target.value)}/>}><CalendarInput {...props}/></Suspense>;
}

/** Capsule-track treatment from the supplied spinner, without a continuous JS animation. */
export function LoadingIndicator({ label, inline = false }: { label?: string; inline?: boolean }) {
  return <span role="status" className={'loading-indicator' + (inline ? ' inline' : '')}><span className="capsule-track" aria-hidden="true"><i/></span><span>{label || tr('Chargement…', 'Loading…')}</span></span>;
}

/** Adapted centre-out letter cascade; a stable accessible name avoids spelling out characters. */
export function LetterCascade({ text, className = '' }: { text: string; className?: string }) {
  let index = 0;
  return <span className={'letter-cascade ' + className}><span className="visually-hidden">{text}</span><span className="letter-visual" aria-hidden="true">{text.split(' ').map((word, wordIndex) => <span key={wordIndex}>{wordIndex > 0 && ' '}<span className="letter-word">{Array.from(word).map(letter => { const i = index++; return <span className="letter-glyph" key={i} style={{ '--letter-delay': `${Math.abs(i - (Array.from(text).length - 1) / 2) * 22}ms` } as CSSProperties}><span>{letter}</span><span className="letter-echo">{letter}</span></span>; })}</span></span>)}</span></span>;
}

/** Wipe treatment adapted from Componentry; the link's name and action stay stable. */
export function HoverTransition({ image, title, detail, href }: { image: string; title: string; detail: string; href: string }) {
  return <a className="subject-card" href={href} aria-label={title}>
    <img src={image} alt="" width="900" height="1200" loading="lazy" decoding="async"/>
    <div className="subject-card-wipe" aria-hidden="true"><p>{detail}</p><span>{tr('Explorer les formations', 'Explore programmes')} <svg viewBox="0 0 24 24"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></span></div>
    <h3><LetterCascade text={title}/></h3>
  </a>;
}
