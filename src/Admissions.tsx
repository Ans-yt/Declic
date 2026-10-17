import { t } from "./i18n";
import { useState } from 'react';
import { outcomeLabels, type Application, type Review } from '../shared/models';
import { Empty, Field, Heading, Icon, Placeholder, useAction } from './ui';
export type Mutate = (path: string, body: unknown, method?: string) => Promise<void>;
const statusLabels = {
  pending: 'À examiner',
  reviewed: 'Prête à partager',
  published: 'Partagée'
};
export function Admissions({
  applications,
  mutate
}: {
  applications: Application[];
  mutate: Mutate;
}) {
  const [selected, setSelected] = useState<string | null>(null),
    [creating, setCreating] = useState(false),
    [query, setQuery] = useState(''),
    [filter, setFilter] = useState('all');
  const current = applications.find(a => a.id === selected);
  const shown = applications.filter(a => (filter === 'all' || a.status === filter) && `${a.reference} ${a.formation}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')));
  return <><Heading title={t("Examiner, expliquer, décider.")} action={<button className="button" onClick={() => {
      setCreating(!creating);
      setSelected(null);
    }} aria-expanded={creating}><Icon name="plus" />{t("Ajouter une candidature")}</button>}>{t("Chaque décision s’accompagne de motifs que l’élève pourra lire.")}</Heading>
    <div className="workspace-strip"><span><Icon name="folder" />{t("Bureau des admissions")}</span><p>{t("Espace de démonstration partagé · utilisez des dossiers fictifs.")}</p></div>
    {creating && <ApplicationForm mutate={mutate} done={() => setCreating(false)} />}
    <div className="review-workbench"><section className="inbox"><div className="inbox-heading"><h2>{t("Candidatures")}</h2><span>{applications.length}</span></div><label className="desk-search"><Icon name="search" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t("Rechercher un dossier…")} aria-label={t("Rechercher une candidature")} /></label><label className="field inbox-filter">{t("Afficher")}<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">{t("Tous les dossiers")}</option>{Object.entries(statusLabels).map(([v, label]) => <option key={v} value={v}>{t(label)}</option>)}</select></label>
      <div className="inbox-list">{shown.length ? shown.map(a => <button className={'inbox-item' + (a.id === selected ? ' selected' : '')} key={a.id} onClick={() => {
            setSelected(a.id);
            setCreating(false);
          }} aria-pressed={a.id === selected}><span className="record-reference">{a.reference}<Icon name="arrow" /></span><strong>{a.formation}</strong><span className={'state-label ' + a.status}>{t(statusLabels[a.status])}</span></button>) : <div className="inbox-placeholder"><Placeholder>{query || filter !== 'all' ? t('Aucun dossier ne correspond à ces filtres') : t('Ici, les candidatures à examiner')}</Placeholder></div>}</div></section>
      <section className="review-desk">{current ? <Evaluation key={current.id + current.updatedAt} application={current} mutate={mutate} /> : <><div className="desk-title"><Icon name="file" /><span>{t("Lecture du dossier")}</span></div><Empty title={applications.length ? t('Choisissez un dossier.') : t('Un regard attentif commence ici.')} icon="file" action={!applications.length ? <button className="button" onClick={() => setCreating(true)}>{t("Ajouter le premier dossier")}<Icon name="plus" /></button> : undefined}>{t("Les éléments du parcours et votre évaluation s’afficheront côte à côte. Chaque réponse pourra être reliée à un critère explicite.")}</Empty><div className="review-principles"><div><strong>{t("Lire")}</strong><p>{t("Les éléments du dossier.")}</p></div><div><strong>{t("Expliquer")}</strong><p>{t("Le lien avec les critères.")}</p></div><div><strong>{t("Partager")}</strong><p>{t("Une réponse compréhensible.")}</p></div></div></>}</section>
    </div></>;
}
function ApplicationForm({
  mutate,
  done
}: {
  mutate: Mutate;
  done: () => void;
}) {
  const [form, setForm] = useState({
    reference: '',
    formation: '',
    summary: ''
  });
  const a = useAction();
  return <form className="workspace-form" onSubmit={e => {
    e.preventDefault();
    void a.run(async () => {
      await mutate('/applications', form);
      done();
    });
  }}><div className="section-heading"><h2>{t("Une candidature à examiner")}</h2><button type="button" className="text-link" onClick={done}>{t("Fermer")}</button></div><div className="field-grid"><Field label={t("Référence anonyme du dossier")} required value={form.reference} onChange={v => setForm({
        ...form,
        reference: v
      })} placeholder={t("*Ici, la référence du dossier*")} /><Field label={t("Formation demandée")} required value={form.formation} onChange={v => setForm({
        ...form,
        formation: v
      })} placeholder={t("*Ici, le nom de la formation*")} /></div><Field label={t("Éléments du parcours")} multiline value={form.summary} onChange={v => setForm({
      ...form,
      summary: v
    })} placeholder={t("*Ici, les éléments du dossier fictif à examiner*")} /><button className="button" disabled={a.busy}>{t("Créer le dossier de démonstration")}<Icon name="arrow" /></button>{a.feedback}</form>;
}
function Evaluation({
  application,
  mutate
}: {
  application: Application;
  mutate: Mutate;
}) {
  const [review, setReview] = useState<Review>(application.review || {
    criterion: '',
    evidence: '',
    explanation: '',
    outcome: 'waiting'
  });
  const [dirty, setDirty] = useState(false);
  const a = useAction();
  const locked = application.status === 'published';
  const update = (patch: Partial<Review>) => {
    setReview({
      ...review,
      ...patch
    });
    setDirty(true);
  };
  return <><div className="desk-title"><span>{t("Dossier ")}{application.reference}</span><span className={'state-label ' + application.status}>{t(statusLabels[application.status])}</span></div><div className="review-content"><h2>{application.formation}</h2><div className="evidence-block"><h3>{t("Les éléments du dossier")}</h3><p>{application.summary || <Placeholder>{t("Aucun élément renseigné")}</Placeholder>}</p></div>
    <form onSubmit={e => {
        e.preventDefault();
        void a.run(() => mutate(`/applications/${application.id}/review`, review, 'PUT'), t('Évaluation enregistrée.'));
      }}><h3>{t("Votre lecture, expliquée au candidat")}</h3><fieldset disabled={locked || a.busy} className="plain-fieldset"><Field label={t("Critère examiné")} required value={review.criterion} onChange={v => update({
            criterion: v
          })} placeholder={t("*Ici, un critère publié par la formation*")} /><Field label={t("Élément du dossier pris en compte")} required value={review.evidence} onChange={v => update({
            evidence: v
          })} placeholder={t("*Ici, le fait qui étaye l’évaluation*")} /><Field label={t("Explication destinée au candidat")} required multiline value={review.explanation} onChange={v => update({
            explanation: v
          })} placeholder={t("*Ici, le lien entre le critère et les éléments examinés*")} /><label className="field">{t("Réponse proposée")}<select value={review.outcome} onChange={e => update({
              outcome: e.target.value as Review['outcome']
            })}>{Object.entries(outcomeLabels).map(([v, label]) => <option value={v} key={v}>{t(label)}</option>)}</select></label></fieldset>
    {!locked && <div className="form-actions"><button className="button" disabled={a.busy}><Icon name="check" />{t("Enregistrer l’évaluation")}</button><button className="button secondary" type="button" disabled={a.busy || application.status !== 'reviewed' || dirty} onClick={() => void a.run(() => mutate(`/applications/${application.id}/publish`, {}), t('La réponse apparaît dans l’espace élève.'))}>{t("Partager la réponse")}<Icon name="arrow" /></button></div>}{a.feedback}
    {locked ? <p className="subtle-notice">{t("Réponse partagée dans l’espace élève. L’évaluation est conservée en lecture seule.")}</p> : <p className="subtle-notice">{t("Enregistrez l’évaluation avant de partager. Aucune transmission à Parcoursup.")}</p>}</form>
    {application.questions.length > 0 && <section className="clarification-thread"><h3>{t("Les demandes de clarification")}</h3>{application.questions.map(q => <QuestionReply key={q.id} question={q} applicationId={application.id} mutate={mutate} />)}</section>}
    </div></>;
}
function QuestionReply({
  question,
  applicationId,
  mutate
}: {
  question: Application['questions'][number];
  applicationId: string;
  mutate: Mutate;
}) {
  const [answer, setAnswer] = useState(question.answer);
  const a = useAction();
  return <form className="question" onSubmit={e => {
    e.preventDefault();
    void a.run(() => mutate(`/applications/${applicationId}/questions/${question.id}`, {
      answer
    }, 'PUT'), t('Réponse enregistrée.'));
  }}><p>{question.text}</p>{question.answer ? <blockquote>{question.answer}</blockquote> : <><Field label={t("Réponse à la demande")} required multiline value={answer} onChange={setAnswer} /><button className="button" disabled={a.busy}>{t("Répondre dans la démonstration")}</button></>}{a.feedback}</form>;
}
