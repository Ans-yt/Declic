import { useEffect, useRef, useState } from 'react';
import type { LiquidGlassCarouselHandle } from './components/GlassEngine';
import { subjects, subjectImage, subjectRoute } from './subjects';
import { getLanguage, tr } from './i18n';
import { Icon } from './ui';
import { LetterCascade, HoverTransition } from './components/Controls';
import { Pause, Play } from 'lucide-react';

export default function SubjectDiscovery() {
  const mount = useRef<HTMLDivElement>(null), captions = useRef<HTMLDivElement>(null), fallback = useRef<HTMLDivElement>(null);
  const carousel = useRef<HTMLDivElement>(null);
  const engine = useRef<LiquidGlassCarouselHandle | null>(null);
  const [active, setActive] = useState(0), [ready, setReady] = useState(false), [focused, setFocused] = useState(false);
  const [paused, setPaused] = useState(false), [hovered, setHovered] = useState(false), [keyboardFocus, setKeyboardFocus] = useState(false);
  const activeRef = useRef(active), lastInteraction = useRef(0), visible = useRef(false), pointerHeld = useRef(false);
  activeRef.current = active;
  const language = getLanguage();
  const current = subjects[active];
  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let cancelled = false, cleanup = () => {}, observer: IntersectionObserver | undefined;
    const reset = () => { cleanup(); engine.current = null; setReady(false); setFocused(false); };
    const start = async () => {
      if (cancelled || motion.matches || engine.current) return;
      try {
        const { createCarousel } = await import('./components/GlassEngine');
        if (cancelled || motion.matches) return;
        const instance = createCarousel(el, null, {
          items: subjects.map(s => ({ src: subjectImage(s.id), title: language === 'fr' ? s.fr : s.en, aspect: 3 / 4 })),
          panelHeight: 380, gap: 20, background: '#f7efe9', entry: false,
          onActiveChange: setActive, onFocusChange: setFocused, onEntryDone: () => {},
          onLayout: panels => {
            const host = captions.current;
            if (!host) return;
            host.querySelectorAll<HTMLElement>('.glass-caption').forEach(el => { el.hidden = true; });
            for (const p of panels) {
              let caption = host.querySelector<HTMLElement>(`[data-slot="${p.slot}"]`);
              if (!caption) { caption = document.createElement('div'); caption.className = 'glass-caption'; caption.dataset.slot = String(p.slot); const title = document.createElement('span'); title.textContent = language === 'fr' ? subjects[p.index].fr : subjects[p.index].en; caption.append(title); host.append(caption); }
              caption.hidden = false;
              caption.style.width = `${p.width}px`; caption.style.height = `${p.height}px`;
              caption.style.transform = `translate3d(${p.left}px,${p.top}px,0)`;
            }
          },
        });
        if (!instance) return;
        engine.current = instance; setReady(true);
        const lost = (event: Event) => { event.preventDefault(); reset(); };
        el.addEventListener('webglcontextlost', lost, true);
        cleanup = () => { instance.destroy(); el.removeEventListener('webglcontextlost', lost, true); captions.current?.replaceChildren(); };
      } catch { reset(); }
    };
    observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { void start(); observer?.disconnect(); } }, { rootMargin: '150px' });
    observer.observe(el);
    const changed = () => { if (motion.matches) reset(); else void start(); };
    motion.addEventListener('change', changed);
    return () => { cancelled = true; observer?.disconnect(); motion.removeEventListener('change', changed); cleanup(); engine.current = null; };
  }, [language]);
  useEffect(() => {
    const element = carousel.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => { visible.current = entry.isIntersecting && entry.intersectionRatio >= 0.35; }, { threshold: [0, 0.35] });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (paused || hovered || keyboardFocus || focused) return;
    const timer = window.setInterval(() => {
      if (document.hidden || !visible.current || pointerHeld.current || matchMedia('(prefers-reduced-motion: reduce)').matches || performance.now() - lastInteraction.current < 3000) return;
      step(1, true);
    }, 3000);
    return () => clearInterval(timer);
  }, [paused, hovered, keyboardFocus, focused, ready]);
  function step(direction: number, automatic = false) {
    if (!automatic) lastInteraction.current = performance.now();
    if (engine.current) { direction > 0 ? engine.current.next() : engine.current.previous(); }
    else { const index = (activeRef.current + direction + subjects.length) % subjects.length; fallback.current?.children[index]?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest', inline: 'center' }); setActive(index); }
  }
  function closeFocus() { engine.current?.closeFocus(); carousel.current?.focus({ preventScroll: true }); }
  return <section className="subject-discovery" aria-labelledby="subjects-title" onPointerEnter={event => { if (event.pointerType !== 'touch') setHovered(true); }} onPointerLeave={() => setHovered(false)} onPointerDown={() => { pointerHeld.current = true; lastInteraction.current = performance.now(); setKeyboardFocus(false); }} onPointerUp={() => { pointerHeld.current = false; lastInteraction.current = performance.now(); }} onPointerCancel={() => { pointerHeld.current = false; }} onLostPointerCapture={() => { pointerHeld.current = false; }} onFocusCapture={event => setKeyboardFocus(event.target.matches(':focus-visible'))} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocus(false); }}>
    <div className="subject-heading"><div><h2 id="subjects-title"><LetterCascade text={tr('Et si la suite commençait ici ?', 'What could your next chapter be?')}/></h2><p>{tr('Une curiosité, une envie, un domaine à explorer.', 'A curiosity, an idea, a subject to explore.')}</p></div><a className="text-link" href="#formations">{tr('Tout explorer', 'Explore everything')}<Icon name="arrow"/></a></div>
    <div ref={carousel} className={'glass-carousel' + (ready ? ' is-ready' : '') + (focused ? ' is-focused' : '')} role="region" aria-roledescription="carousel" aria-label={tr('Explorer les domaines', 'Explore study areas')} tabIndex={0} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); closeFocus(); return; } if (event.target !== event.currentTarget) return; if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1); } if (event.key === 'Enter') location.hash = subjectRoute(current.id).slice(1); }}>
      <div className="glass-mount" ref={mount} aria-hidden="true"/>
      <div className="glass-captions" ref={captions} aria-hidden="true"/>
      <div className="subject-fallback" ref={fallback} hidden={ready} onScroll={event => { const el = event.currentTarget, center = el.getBoundingClientRect().left + el.clientWidth / 2; let nearest = 0, distance = Infinity; Array.from(el.children).forEach((child, index) => { const rect = child.getBoundingClientRect(), next = Math.abs(rect.left + rect.width / 2 - center); if (next < distance) { distance = next; nearest = index; } }); setActive(nearest); }}>{subjects.map(s => <HoverTransition key={s.id} image={subjectImage(s.id)} title={language === 'fr' ? s.fr : s.en} detail={s.detail[language === 'fr' ? 0 : 1]} href={subjectRoute(s.id)}/>)}</div>
      {focused && <button type="button" className="glass-close button" onClick={closeFocus}><Icon name="close"/>{tr('Revenir aux domaines', 'Back to study areas')}</button>}
    </div>
    <div className="carousel-controls"><p className="carousel-hint">{tr('Glissez pour découvrir. Cliquez pour regarder de plus près.', 'Drag to discover. Click for a closer look.')}</p><div className="carousel-current" aria-live={paused || hovered || keyboardFocus ? 'polite' : 'off'} aria-atomic="true"><span>{String(active + 1).padStart(2, '0')} / 08</span><a href={subjectRoute(current.id)}>{tr('Explorer', 'Explore')} {language === 'fr' ? current.fr : current.en}<Icon name="arrow"/></a></div><div className="carousel-arrows"><button type="button" className="icon-button carousel-playback" aria-label={paused ? tr('Reprendre le défilement', 'Resume slideshow') : tr('Mettre le défilement en pause', 'Pause slideshow')} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={16}/> : <Pause size={16}/>}</button><button type="button" className="icon-button" aria-label={tr('Domaine précédent', 'Previous subject')} onClick={() => step(-1)}><Icon name="back"/></button><button type="button" className="icon-button" aria-label={tr('Domaine suivant', 'Next subject')} onClick={() => step(1)}><Icon name="arrow"/></button></div></div>
  </section>;
}
