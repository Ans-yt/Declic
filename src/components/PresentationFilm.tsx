import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Play, X } from 'lucide-react';
import { tr, useLanguage } from '../i18n';

export function PresentationFilm() {
  const language = useLanguage();
  const [open, setOpen] = useState(false), [failed, setFailed] = useState(false), [englishFallback, setEnglishFallback] = useState(false);
  const filmLanguage = englishFallback ? 'en' : language;
  useEffect(() => { setFailed(false); setEnglishFallback(false); }, [language]);
  return <Dialog.Root open={open} onOpenChange={next => { setOpen(next); if (!next) { setFailed(false); setEnglishFallback(false); } }}>
    <Dialog.Trigger className="text-link presentation-trigger"><Play size={16} aria-hidden="true"/>{tr('Regarder la présentation', 'Watch the presentation')}</Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="presentation-overlay"/><Dialog.Content className="presentation-dialog" aria-describedby="presentation-language">
      <div className="presentation-heading"><div><Dialog.Title>{tr('Découvrez Déclic.', 'Meet Déclic.')}</Dialog.Title><Dialog.Description id="presentation-language">{filmLanguage === 'fr' ? tr('Le film de présentation en français.', 'The presentation film in French.') : tr('Le film de présentation en anglais.', 'The presentation film in English.')}</Dialog.Description></div><Dialog.Close className="icon-button" aria-label={tr('Fermer la vidéo', 'Close video')}><X size={18}/></Dialog.Close></div>
      {!failed && <video key={filmLanguage} controls playsInline preload="metadata" aria-label={tr('Présentation de Déclic', 'Déclic presentation')} src={`/assets/declic-launch-film-${filmLanguage}.mp4`} onError={() => setFailed(true)}/>}
      {failed && <div className="presentation-unavailable" role="status"><p>{filmLanguage === 'fr' ? tr('La vidéo française n’est pas encore disponible.', 'The French film is not available yet.') : tr('La vidéo n’a pas pu être chargée.', 'The video could not be loaded.')}</p>{filmLanguage === 'fr' ? <button type="button" className="button" onClick={() => { setFailed(false); setEnglishFallback(true); }}><Play size={16}/>{tr('Voir la version anglaise', 'Watch the English version')}</button> : <button type="button" className="button" onClick={() => setFailed(false)}>{tr('Réessayer', 'Try again')}</button>}</div>}
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
