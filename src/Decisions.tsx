import { t, tr } from "./i18n";
import { useState } from 'react';
import { outcomeLabels, type Application } from '../shared/models';
import type { Mutate } from './Admissions';
import { Empty, Field, Heading, Icon, LinkButton, Sticker, useAction } from './ui';
export function Decisions({
  applications,
  mutate
}: {
  applications: Application[];
  mutate: Mutate;
}) {
  const published = applications.filter(a => a.status === 'published' && a.review);
  return <><Heading title={t("Une réponse, des explications.")}>{t("Retrouvez les éléments qui permettent de comprendre une décision.")}</Heading>{published.length ? published.map(app => <Decision key={app.id} application={app} mutate={mutate} />) : <div className="decision-layout"><section className="decision-sheet"><Empty title={tr("Aucune décision partagée pour le moment", "No decision has been shared yet")} icon="file" action={<LinkButton to="suivi">{tr("Voir mes candidatures", "View my applications")}</LinkButton>}>{tr("L’établissement doit d’abord examiner une candidature fictive et publier sa réponse dans cette démonstration. Vous pouvez consulter vos candidatures en attendant.", "The institution first needs to review a fictional application and publish its response in this demonstration. You can view your applications in the meantime.")}</Empty></section><aside className="clarification-panel"><Sticker name="smiley" /><h2>{t("Une question mérite une réponse.")}</h2><p>{t("Quand une décision sera partagée, vous pourrez demander une clarification ici et retrouver la réponse de l’établissement.")}</p><p className="subtle-notice">{tr("Les candidatures et réponses présentées ici sont fictives. Aucune candidature n’est envoyée à Parcoursup.", "Applications and responses shown here are fictional. No application is submitted to Parcoursup.")}</p><a className="text-link" href="#aide">{tr("Comprendre les réponses", "Understand the responses")}<Icon name="arrow"/></a></aside></div>}</>;
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
  return <section className="decision-layout" aria-label={tr('Décision pour ', 'Decision for ') + app.formation}><article className="decision-sheet"><div className="section-heading"><h2>{app.formation}</h2><span className="state-label published">{t(outcomeLabels[review.outcome])}</span></div><p>{t("Dossier ")}{app.reference}{t(" · Réponse de démonstration")}</p><div className="evidence-block"><p>{review.explanation}</p></div><table className="decision-criteria"><thead><tr><th scope="col">{t("Critère examiné")}</th><th scope="col">{t("Élément du dossier")}</th><th scope="col">{t("Explication")}</th></tr></thead><tbody><tr><td>{review.criterion}</td><td>{review.evidence}</td><td>{review.explanation}</td></tr></tbody></table><p className="decision-source">{t("Source : évaluation partagée dans le bureau des admissions de cette démonstration.")}</p>{app.questions.map(q => <div className="question" key={q.id}><strong>{t("Votre demande")}</strong><p>{q.text}</p>{q.answer ? <><strong>{t("La réponse de l’établissement")}</strong><blockquote>{q.answer}</blockquote></> : <small>{t("En attente d’une réponse de l’établissement.")}</small>}</div>)}</article><aside className="clarification-panel"><Sticker name="smiley" /><h2>{t("Demander une clarification")}</h2><p>{t("À propos du critère : ")}<strong>{review.criterion}</strong></p><form onSubmit={e => {
        e.preventDefault();
        void action.run(async () => {
          await mutate(`/applications/${app.id}/questions`, {
            text: question
          });
          setQuestion('');
        }, t('Votre demande est visible dans le bureau des admissions.'));
      }}><Field label={t("Votre question")} multiline required value={question} onChange={setQuestion} placeholder={tr("Le point à clarifier ou l’erreur à signaler", "The point to clarify or error to report")} /><button className="button" disabled={action.busy}>{t("Enregistrer ma demande")}<Icon name="arrow" /></button><p className="subtle-notice">{t("Enregistrée dans Déclic, pour cette démonstration.")}</p>{action.feedback}</form></aside></section>;
}
