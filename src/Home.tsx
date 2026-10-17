import { t } from "./i18n";
import type { CV } from '../shared/models';
import { Icon, LinkButton, Notebook, Sticker } from './ui';
export function Home({
  cv
}: {
  cv: CV;
}) {
  const next = !cv.education.some(e => e.title.trim()) ? 'formation' : !cv.experience.some(e => e.title.trim()) ? t('expériences') : !cv.engagement.some(e => e.title.trim()) ? t('engagements') : t('présentation');
  return <><section className="home-intro"><div><h1>{t("Votre avenir")}<br />{' '}{t("prend forme.")}</h1><p>{t("Un espace pour explorer, comprendre et avancer sereinement.")}</p><div className="home-actions"><LinkButton to="dossier">{t("Construire mon projet")}</LinkButton><LinkButton to="formations">{t("Explorer les formations")}</LinkButton></div></div><Notebook variant="kit" /></section><section className="home-journey"><h2>{t("À chaque étape, un repère.")}</h2><div className="journey-grid">{[['01', t('Explorez les possibles'), t('Parcourez les formations et gardez vos pistes.'), 'formations'], ['02', t('Faites le point sur votre dossier'), t('Profil et CV à compléter, au même endroit.'), 'dossier'], ['03', t('Avancez avec les bonnes informations'), t('Suivi des candidatures et réponses expliquées.'), 'suivi']].map(([number, title, text, route]) => <a className="journey-tile" href={'#' + route} key={route}><span className="step-number">{number}</span><div><h3>{t(title)}</h3><p>{t(text)}</p></div><Icon name="arrow" /></a>)}</div></section><div className="home-next-grid"><section className="home-next"><div><h2>{t("Votre prochain pas")}</h2><p>{t("Compléter « {section} » dans votre CV.", { section: t(next) })}</p><small>{t("Un projet, un apprentissage, une activité : chaque expérience compte.")}</small></div><LinkButton to="cv">{t("Ouvrir mon CV")}</LinkButton></section><aside className="home-guidance"><Sticker name="heart" /><h2>{t("Comprendre, c’est déjà avancer.")}</h2><p>{t("Critères, réponses, listes d’attente : trouvez vos repères.")}</p><a className="text-link" href="#aide">{t("Trouver mes repères")}<Icon name="arrow" /></a></aside></div></>;
}
