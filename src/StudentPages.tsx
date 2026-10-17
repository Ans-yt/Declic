import { t } from "./i18n";
import { useState } from 'react';
import { outcomeLabels, type Application, type CV, type Profile, type Workspace } from '../shared/models';
import { Empty, Field, Heading, Icon, LinkButton, Notebook, Placeholder, Sticker, Workflow, useAction } from './ui';
import type { Mutate } from './Admissions';
export function Welcome({
  data,
  mutate,
  setCV
}: {
  data: Workspace;
  mutate: Mutate;
  setCV: (cv: CV) => void;
}) {
  const [review, setReview] = useState(false),
    [selected, setSelected] = useState({
      identity: true,
      school: true,
      education: true
    });
  const action = useAction();
  if (review) return <div className="entry-wrap"><button className="text-link back" onClick={() => setReview(false)}><Icon name="back" />{t("Revenir au choix")}</button><h1>{t("Votre dossier,")}<br />{t("avec une longueur d’avance.")}</h1><p>{t("Choisissez les informations à retrouver dans votre espace.")}</p><div className="connection-notice">{t("Démonstration ENT · Aucun identifiant demandé. Seuls des emplacements fictifs sont importés.")}</div><form className="panel form-panel" onSubmit={e => {
      e.preventDefault();
      void action.run(async () => {
        await mutate('/profile', {
          ...data.profile,
          ...(selected.identity ? {
            firstname: data.profile.firstname || '*Prénom depuis l’ENT*',
            lastname: data.profile.lastname || '*Nom depuis l’ENT*'
          } : {}),
          ...(selected.school ? {
            school: data.profile.school || '*Établissement depuis l’ENT*',
            path: data.profile.path || '*Parcours depuis l’ENT*'
          } : {})
        }, 'PUT');
        if (selected.education && !data.cv.education.some(e => e.title === '*Cursus depuis l’ENT*')) {
          const cv = {
            ...data.cv,
            education: [...data.cv.education, {
              id: crypto.randomUUID(),
              title: '*Cursus depuis l’ENT*',
              organization: '*Établissement depuis l’ENT*',
              period: '',
              detail: ''
            }]
          };
          await mutate('/cv', cv, 'PUT');
          setCV(cv);
        }
        location.hash = 'dossier';
      });
    }}><h2>{t("Vérifier avant de continuer")}</h2>{([['identity', t('Identité')], ['school', t('Scolarité')], ['education', t('Parcours pour le CV')]] as const).map(([key, label]) => <label className="import-row" key={key}><input type="checkbox" checked={selected[key]} onChange={e => setSelected({
          ...selected,
          [key]: e.target.checked
        })} /><span><strong>{t(label)}</strong><small><Placeholder>{t("Ici, les informations de votre ENT")}</Placeholder></small></span><Icon name="check" /></label>)}<p className="connection-notice">{t("Vous pourrez modifier chaque champ avant de l’utiliser.")}</p><button className="button" disabled={action.busy}>{t("Préremplir mon espace")}<Icon name="arrow" /></button>{action.feedback}</form></div>;
  return <div className="entry-layout"><section className="entry-intro"><a className="entry-brand" href="#connexion" aria-label={t("Déclic, bienvenue")}><img src="/assets/brand/declic-wordmark.png" alt={t("déclic")} width="220" /></a><h1>{t("Votre parcours.")}<br />{t("Vos envies.")}<br />{t("La suite, ensemble.")}</h1><p>{t("Un même espace pour préparer votre dossier, valoriser votre parcours et comprendre vos candidatures.")}</p><Notebook /><p className="photo-caption">{t("votre prochaine page commence ici.")}</p></section><section className="entry-choice"><Sticker name="smiley" className="sticker-welcome" /><h2>{t("Bienvenue dans")}<br />{t("votre espace.")}</h2><p>{t("Commencez avec votre ENT ou prenez le temps de compléter votre profil.")}</p><button className="button ent-button" onClick={() => setReview(true)}><Icon name="school" />{t("Se connecter avec mon ENT")}<Icon name="arrow" /></button><p className="connection-notice">{t("Connexion simulée · Aucun accès à votre établissement.")}</p><div className="entry-divider"><span>{t("ou")}</span></div><LinkButton to="dossier">{t("Compléter mon profil manuellement")}</LinkButton><a className="text-link section-space" href="#accueil">{t("Découvrir l’interface")}<Icon name="arrow" /></a><div className="entry-professional"><p>{t("Vous travaillez dans l’éducation ?")}</p><a href="#admissions" className="text-link">{t("Ouvrir l’espace professionnel")}<Icon name="arrow" /></a></div></section></div>;
}
export function ProfilePage({
  profile,
  save
}: {
  profile: Profile;
  save: (v: Profile) => Promise<void>;
}) {
  const [form, setForm] = useState(profile);
  const a = useAction();
  return <><Heading title={t("Un dossier qui vous ressemble.")}>{t("Rassemblez les éléments de votre parcours, à votre rythme.")}</Heading><div className="profile-layout"><form className="panel form-panel" onSubmit={e => {
        e.preventDefault();
        void a.run(() => save(form), t('Votre dossier est enregistré. Il reste disponible après rechargement.'));
      }}><h2>{t("Votre profil")}</h2><p>{t("Ces informations apparaîtront aussi dans votre CV. Utilisez des informations fictives pour la démo.")}</p><div className="field-grid">{([['firstname', t('Prénom')], ['lastname', t('Nom')], ['school', t('Établissement')], ['path', t('Parcours / niveau')], ['city', t('Ville')], ['email', t('Adresse e-mail')]] as const).map(([key, label]) => <Field key={key} label={label} value={form[key]} type={key === 'email' ? 'email' : 'text'} onChange={v => setForm({
            ...form,
            [key]: v
          })} placeholder={`*${t(label)}*`} />)}</div><Field label={t("Ce qui vous intéresse")} multiline value={form.interests} onChange={v => setForm({
          ...form,
          interests: v
        })} placeholder={t("*Ici, vos envies, vos matières et vos domaines d’intérêt*")} /><button className="button" disabled={a.busy}><Icon name="check" />{t("Enregistrer mon dossier")}</button>{a.feedback}</form><aside className="note"><Icon name="file" /><h3>{t("Votre parcours a des choses à dire.")}</h3><p>{t("Vos expériences, vos projets et vos engagements trouvent leur place dans votre CV.")}</p><LinkButton to="cv">{t("Construire mon CV")}</LinkButton><a href="#connexion" className="text-link section-space">{t("Préremplissage ENT simulé")}<Icon name="arrow" /></a></aside></div><section className="section-space"><h2>{t("Les pièces du dossier")}</h2><div className="placeholder-block"><Placeholder>{t("Ici, les documents attendus et les consignes de l’établissement. Le dépôt de pièces n’est pas encore connecté.")}</Placeholder></div></section></>;
}
export function Applications({
  applications
}: {
  applications: Application[];
}) {
  return <><Heading title={t("Gardez le fil de vos candidatures.")}>{t("Un statut compréhensible, une prochaine étape identifiable.")}</Heading>{applications.length ? applications.map(a => <article className="decision-sheet" key={a.id}><div className="section-heading"><h2>{a.formation}</h2><span className="state-label">{a.status === 'published' && a.review ? t(outcomeLabels[a.review.outcome]) : t('En cours d’examen')}</span></div><Workflow steps={[t("Dossier créé"), t("Examen en cours"), t("Réponse partagée")]} current={a.status === "published" ? 3 : 1} /><p>{t("Référence ")}{a.reference}</p><p>{a.status === 'published' ? t('La réponse de l’établissement et son explication sont disponibles.') : t('Votre dossier est en cours de lecture. Vous retrouverez ici la réponse lorsqu’elle sera partagée.')}</p><a href="#decisions" className="text-link">{t("Comprendre ma réponse")}<Icon name="arrow" /></a></article>) : <Empty title={t("Vos prochaines étapes, au même endroit.")} icon="route"><Placeholder>{t("Ici, vos candidatures et leur statut. Ajoutez un dossier fictif depuis l’espace établissement pour essayer le parcours.")}</Placeholder></Empty>}</>;
}
export function Help() {
  return <><Heading title={t("Les bons repères, au bon moment.")}>{t("Un espace pour avancer dans vos démarches et comprendre la démonstration.")}</Heading><div className="support-grid"><section>{[[t('Comment utiliser cette démonstration ?'), t('Complétez votre profil et votre CV. Le sélecteur « Mon espace » permet ensuite d’ouvrir le bureau des admissions et les remplacements. Les données sont partagées entre ces vues, sur cet ordinateur.')], [t('Où sont enregistrées mes informations ?'), t('Le profil, le CV, les favoris, les candidatures et les remplacements sont enregistrés dans la base locale de Déclic. Utilisez uniquement des informations fictives.')], [t('Comment lire une liste d’attente ?'), '*Ici, une explication sourcée des rangs et de l’évolution d’une liste d’attente. Aucun rang ni pronostic n’est calculé par cette démonstration.*'], [t('Comment fonctionne le relais entre enseignants ?'), t('Créez un besoin et une disponibilité compatible, vérifiez le profil dans le vivier, puis confirmez l’affectation. Une fois le cours terminé, ses heures peuvent être validées.')], [t('L’ENT est-il connecté ?'), t('Le bouton ENT simule un préremplissage avec des emplacements modifiables. Aucun accès à un compte scolaire n’est effectué.')]].map(([q, answer]) => <details className="faq" key={q}><summary>{t(q)}</summary><p>{t(answer)}</p></details>)}</section><aside className="note"><Icon name="help" /><h3>{t("Une question mérite une vraie réponse.")}</h3><p>{t("Pour un dossier de démonstration, ouvrez la décision et enregistrez une demande de clarification.")}</p><a className="text-link" href="#decisions">{t("Voir mes décisions")}<Icon name="arrow" /></a></aside></div></>;
}
