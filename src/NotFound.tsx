import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { tr } from './i18n';

const WORD = '404';

// Three-level amplitude ramp: one level per second up, 2.5 per second down.
const LEVEL_COUNT = 1;
const LEVEL_RAMP = 1.0;
const LEVEL_DECAY = 2.5;
const MAX_SCALE = 36;
const OSCILLATION_HZ = 0.09;
const REST_FREQ = 0.001;
const HOVER_FREQ = 0.009;
const RIPPLE_PHASE_RATE = 0.9;

const FAN_FULL_RATE = (Math.PI * 2) / 0.6;
const FAN_REDUCED_RATE = (Math.PI * 2) / 2.0;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

function useAnimationFrame(callback: (time: number) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let frame = 0;
    const tick = (time: number) => {
      callbackRef.current(time);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
}

export function NotFound() {
  const reducedMotion = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const filterId = `not-found-ripple-${uid}`;

  const turbulence = useRef<SVGFETurbulenceElement>(null);
  const displacement = useRef<SVGFEDisplacementMapElement>(null);
  const blades = useRef<SVGGElement>(null);
  const word = useRef<SVGSVGElement>(null);

  const [fanOn, setFanOn] = useState(false);
  const fanOnRef = useRef(false);
  useEffect(() => { fanOnRef.current = fanOn; }, [fanOn]);

  const level = useRef(0);
  const fanAngle = useRef(0);
  const ripplePhase = useRef(0);
  const lastTime = useRef<number | null>(null);

  useAnimationFrame(time => {
    const noise = turbulence.current;
    const map = displacement.current;
    const bladeGroup = blades.current;
    if (!noise || !map) return;

    const previous = lastTime.current;
    const delta = previous == null ? 0 : Math.max(0, Math.min(0.05, (time - previous) / 1000));
    lastTime.current = time;

    if (fanOnRef.current) {
      level.current = Math.min(LEVEL_COUNT, level.current + LEVEL_RAMP * delta);
    } else {
      level.current = Math.max(0, level.current - LEVEL_DECAY * delta);
    }

    const intensity = level.current / LEVEL_COUNT;
    const seconds = time / 1000;
    const breath = Math.sin(seconds * Math.PI * 2 * OSCILLATION_HZ);

    const peakScale = reducedMotion ? 14 : MAX_SCALE;
    const scale = intensity * peakScale;
    const frequency = Math.max(
      0.002,
      REST_FREQ + (HOVER_FREQ - REST_FREQ) * intensity + 0.004 * breath * intensity,
    );

    ripplePhase.current += intensity * RIPPLE_PHASE_RATE * delta;
    const phase = ripplePhase.current;
    const frequencyX = Math.max(0.002, frequency + 0.007 * Math.sin(phase) * intensity);
    const frequencyY = Math.max(0.002, 0.028 + 0.012 * Math.sin(phase * 1.4 + 1) * intensity);
    noise.setAttribute('baseFrequency', `${frequencyX} ${frequencyY}`);
    map.setAttribute('scale', String(scale));

    if (word.current) {
      const skew = reducedMotion ? 0 : intensity * 13;
      word.current.style.transform = `skewX(${skew}deg)`;
    }

    if (bladeGroup) {
      const rate = reducedMotion ? FAN_REDUCED_RATE : FAN_FULL_RATE;
      fanAngle.current += rate * intensity * delta;
      if (fanAngle.current > Math.PI * 2) fanAngle.current -= Math.PI * 2;
      bladeGroup.style.transform = `rotate(${(fanAngle.current * 180) / Math.PI}deg)`;
    }
  });

  const toggleFan = () => setFanOn(value => !value);
  const handleFanKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      toggleFan();
    }
  };

  return <section className="not-found" aria-labelledby="not-found-title">
    <div className="not-found-glow" aria-hidden="true" />
    <div className="not-found-inner">
      <div className="not-found-hero">
        <div
          className="not-found-fan"
          role="button"
          aria-label={tr('Activer ou désactiver le ventilateur', 'Toggle fan')}
          aria-pressed={fanOn}
          tabIndex={0}
          onClick={toggleFan}
          onKeyDown={handleFanKey}
        >
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.85" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
            <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25" />
            <g
              ref={blades}
              style={{ transformBox: 'view-box', transformOrigin: '50px 50px', willChange: 'transform' }}
            >
              {[0, 120, 240].map(angle => <path
                key={angle}
                d="M50 50 C 56 34, 64 28, 70 26 C 66 34, 60 42, 50 50 Z"
                fill="currentColor"
                opacity="0.9"
                transform={`rotate(${angle} 50 50)`}
              />)}
            </g>
            <circle cx="50" cy="50" r="4.5" fill="currentColor" />
            <circle cx="50" cy="50" r="1.6" fill="var(--paper)" />
          </svg>
          <span className="not-found-fan-state" data-on={fanOn}>{fanOn ? 'ON' : 'OFF'}</span>
        </div>

        <svg
          ref={word}
          className="not-found-word"
          role="img"
          aria-label={WORD}
          viewBox="0 0 320 180"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id={filterId} x="-15%" y="-15%" width="130%" height="130%">
              <feTurbulence
                ref={turbulence}
                type="fractalNoise"
                baseFrequency={REST_FREQ}
                numOctaves={1}
                seed={4}
                result="noise"
              />
              <feDisplacementMap
                ref={displacement}
                in="SourceGraphic"
                in2="noise"
                scale={0}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
          <g filter={`url(#${filterId})`} fill="currentColor">
            <text x="160" y="150" textAnchor="middle">{WORD}</text>
          </g>
        </svg>
      </div>

      <h1 id="not-found-title">{tr(
        'Cette page semble avoir traversé un portail temporel.',
        'This page seems to have slipped through a time portal.',
      )}</h1>
      <p>{tr(
        'Désolé pour cette perturbation du continuum espace-temps. Revenez à l’accueil quand vous voulez.',
        'We apologize for any disruption to the space-time continuum. Feel free to journey back to our homepage.',
      )}</p>
      <a className="button not-found-home" href="#accueil">{tr('Retour à l’accueil', 'Go back home')}</a>
    </div>
  </section>;
}
