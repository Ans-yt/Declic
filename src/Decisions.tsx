import { t } from "./i18n";
import { useState } from 'react';
import { outcomeLabels, type Application } from '../shared/models';
import type { Mutate } from './Admissions';
import { Empty, Field, Heading, Icon, Placeholder, Sticker, useAction } from './ui';
export function Decisions({
  applications,
  mutate
}: {
  applications: Application[];
  mutate: Mutate;
}) {
  const published = applications.filter(a => a.status === 'published' && a.review);
  return <><Heading title={t("Une réponse, des explications.")}>{t("Retrouvez les éléments qui permettent de comprendre une décision.")}</Heading>{published.length ? published.map(app => <Decision key={app.id} application={app} mutate={mutate} />) : <div className="decision-layout"><section className="decision-sheet"><Empty title={t("Comprendre avant de poursuivre.")} icon="file"><Placeholder>{t("Ici, la décision de l’établissement, les critères examinés et les éléments pris en compte.")}</Placeholder></Empty></section><aside className="clarification-panel"><Sticker name="smiley" /><h2>{t("Une question mérite une réponse.")}</h2><p>{t("Quand une décision sera partagée, vous pourrez demander une clarification ici et retrouver la réponse de l’établissement.")}</p><p className="subtle-notice">{t("Aucune réponse n’a encore été partagée dans la démonstration.")}</p></aside></div>}</>;
}
function Decision({
  application: app,
  mutate
}: {
  application: Application;
  mutate: Mutate;
}) {
  const [question, setQuestion] = useState('');
  const action = useAction();
  const review = app.review!;
  return <section className="decision-layout" aria-label={'Décision pour ' + app.formation}><article className="decision-sheet"><div className="section-heading"><h2>{app.formation}</h2><span className="state-label published">{t(outcomeLabels[review.outcome])}</span></div><p>{t("Dossier ")}{app.reference}{t(" · Réponse de démonstration")}</p><div className="evidence-block"><p>{review.explanation}</p></div><table className="decision-criteria"><thead><tr><th scope="col">{t("Critère examiné")}</th><th scope="col">{t("Élément du dossier")}</th><th scope="col">{t("Explication")}</th></tr></thead><tbody><tr><td>{review.criterion}</td><td>{review.evidence}</td><td>{review.explanation}</td></tr></tbody></table><p className="decision-source">{t("Source : évaluation partagée dans le bureau des admissions de cette démonstration.")}</p>{app.questions.map(q => <div className="question" key={q.id}><strong>{t("Votre demande")}</strong><p>{q.text}</p>{q.answer ? <><strong>{t("La réponse de l’établissement")}</strong><blockquote>{q.answer}</blockquote></> : <small>{t("En attente d’une réponse de l’établissement.")}</small>}</div>)}</article><aside className="clarification-panel"><Sticker name="smiley" /><h2>{t("Demander une clarification")}</h2><p>{t("À propos du critère : ")}<strong>{review.criterion}</strong></p><form onSubmit={e => {
        e.preventDefault();
        void action.run(async () => {
          await mutate(`/applications/${app.id}/questions`, {
            text: question
          });
          setQuestion('');
        }, t('Votre demande est visible dans le bureau des admissions.'));
      }}><Field label={t("Votre question")} multiline required value={question} onChange={setQuestion} placeholder={t("*Ici, le point à clarifier ou l’erreur à signaler*")} /><button className="button" disabled={action.busy}>{t("Enregistrer ma demande")}<Icon name="arrow" /></button><p className="subtle-notice">{t("Enregistrée dans Déclic, pour cette démonstration.")}</p>{action.feedback}</form></aside></section>;
}
