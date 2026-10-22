import { lazy, Suspense } from 'react';
import { LoadingIndicator } from './components/Controls';
import { PresentationFilm } from './components/PresentationFilm';
const SubjectDiscovery = lazy(() => import('./SubjectDiscovery'));
import { t, tr } from "./i18n";
import type { CV } from '../shared/models';
import { Icon, LinkButton, Notebook, Sticker } from './ui';

export function nextCVSection(cv: CV): 'presentation' | 'education' | 'skills' | 'languages' | null {
  if (!cv.title.trim() || !cv.about.trim()) return 'presentation';
  if (!cv.education.some(entry => entry.title.trim())) return 'education';
  if (!cv.skills.trim()) return 'skills';
  if (!cv.languages.trim()) return 'languages';
  return null;
}

export function Home({
  cv
}: {
  cv: CV;
}) {
  const next = nextCVSection(cv);
  const sectionLabels = {
    presentation: tr('Mon projet', 'My project'),
    education: tr('Formation', 'Education'),
    skills: tr('Compétences', 'Skills'),
    languages: tr('Langues', 'Languages'),
  };
  return <><section className="home-intro"><div><h1>{t("Votre avenir")}<br />{' '}{t("prend forme.")}</h1><p>{t("Un espace pour explorer, comprendre et avancer sereinement.")}</p><div className="home-actions"><LinkButton to="dossier">{t("Construire mon projet")}</LinkButton><LinkButton to="formations">{t("Explorer les formations")}</LinkButton></div><PresentationFilm/></div><Notebook variant="kit" /></section><Suspense fallback={<LoadingIndicator/>}><SubjectDiscovery/></Suspense><section className="home-journey"><h2>{t("À chaque étape, un repère.")}</h2><div className="journey-grid">{[['01', t('Explorez les possibles'), t('Parcourez les formations et gardez vos pistes.'), 'formations'], ['02', t('Faites le point sur votre dossier'), t('Profil et CV à compléter, au même endroit.'), 'dossier'], ['03', t('Avancez avec les bonnes informations'), t('Suivi des candidatures et réponses expliquées.'), 'suivi']].map(([number, title, text, route]) => <a className="journey-tile" href={'#' + route} key={route}><span className="step-number">{number}</span><div><h3>{t(title)}</h3><p>{t(text)}</p></div><Icon name="arrow" /></a>)}</div></section><div className="home-next-grid"><section className="home-next"><div><h2>{t("Votre prochain pas")}</h2><p>{next ? tr(`Compléter « ${sectionLabels[next]} » dans votre CV.`, `Complete “${sectionLabels[next]}” in your CV.`) : tr('Les rubriques essentielles sont renseignées. Relisez votre CV, puis exportez-le si vous le souhaitez.', 'Your essential sections are filled in. Review your CV, then export it when you are ready.')}</p><small>{tr('Les expériences, engagements et récompenses sont facultatifs.', 'Experience, activities and awards are optional.')}</small></div><LinkButton to={next ? `cv/${next}` : 'cv'}>{next ? tr('Compléter cette rubrique', 'Complete this section') : tr('Relire et exporter mon CV', 'Review and export my CV')}</LinkButton></section><aside className="home-guidance"><Sticker name="heart" /><h2>{t("Comprendre, c’est déjà avancer.")}</h2><p>{t("Critères, réponses, listes d’attente : trouvez vos repères.")}</p><a className="text-link" href="#aide">{t("Trouver mes repères")}<Icon name="arrow" /></a></aside></div></>;
}
