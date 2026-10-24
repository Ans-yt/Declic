import { t, tr } from "./i18n";
import { BackupControls } from './BackupControls';
import { Checkbox } from './components/ui/checkbox';
import { Button04 } from './components/ui/animated-arrow-button';
import { PresentationFilm } from './components/PresentationFilm';
import { useEffect, useState } from 'react';
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
    }}><h2>{t("Vérifier avant de continuer")}</h2>{([['identity', t('Identité')], ['school', t('Scolarité')], ['education', t('Parcours pour le CV')]] as const).map(([key, label]) => <label className="import-row" key={key} htmlFor={'ent-' + key}><Checkbox id={'ent-' + key} checked={selected[key]} onCheckedChange={checked => setSelected({
          ...selected,
          [key]: checked === true
        })} /><span><strong>{t(label)}</strong><small><Placeholder>{t("Ici, les informations de votre ENT")}</Placeholder></small></span><Icon name="check" /></label>)}<p className="connection-notice">{t("Vous pourrez modifier chaque champ avant de l’utiliser.")}</p><button className="button" disabled={action.busy}>{t("Préremplir mon espace")}<Icon name="arrow" /></button>{action.feedback}</form></div>;
  return <div className="entry-layout"><section className="entry-intro"><a className="entry-brand" href="#connexion" aria-label={t("Déclic, bienvenue")}><img src="/assets/brand/declic-wordmark.png" alt={t("déclic")} width="220" /></a><h1>{t("Votre parcours.")}<br /><span className="welcome-desktop-line">{t("Vos envies.")}<br /></span>{t("La suite, ensemble.")}</h1><p>{t("Un même espace pour préparer votre dossier, valoriser votre parcours et comprendre vos candidatures.")}</p><a className="button welcome-discover" href="#accueil">{t("Découvrir l’interface")}<Icon name="arrow" /></a></section><section className="entry-choice"><Sticker name="smiley" className="sticker-welcome" /><h2>{t("Bienvenue dans")}<br />{t("votre espace.")}</h2><p>{t("Commencez avec votre ENT ou prenez le temps de compléter votre profil.")}</p><PresentationFilm/><button className="button ent-button" onClick={() => setReview(true)}><Icon name="school" />{t("Se connecter avec mon ENT")}<Icon name="arrow" /></button><p className="connection-notice">{t("Connexion simulée · Aucun accès à votre établissement.")}</p><div className="entry-divider"><span>{t("ou")}</span></div><LinkButton to="dossier">{t("Compléter mon profil manuellement")}</LinkButton><div className="entry-professional"><p>{t("Vous travaillez dans l’éducation ?")}</p><a href="#admissions" className="text-link">{t("Ouvrir l’espace professionnel")}<Icon name="arrow" /></a></div></section><div className="welcome-art"><Notebook /><p className="photo-caption">{t("votre prochaine page commence ici.")}</p></div></div>;
}
export function ProfilePage({ profile, save, draft, setDraft, recovered = false, onBackupImported, hasUnsavedWork = false }: {
  profile: Profile;
  save: (v: Profile) => Promise<void>;
  draft?: Profile;
  setDraft?: (v: Profile) => void;
  recovered?: boolean;
  onBackupImported?: () => Promise<void> | void;
  hasUnsavedWork?: boolean;
}) {
  const [localForm, setLocalForm] = useState(profile);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const form = draft ?? localForm, setForm = setDraft ?? setLocalForm;
  const dirty = JSON.stringify(form) !== JSON.stringify(profile);
  const a = useAction();
  useEffect(() => { if (!draft) setLocalForm(profile); }, [profile, draft]);
  return <><Heading title={t("Un dossier qui vous ressemble.")}>{t("Rassemblez les éléments de votre parcours, à votre rythme.")}</Heading>
    {recovered && dirty && <p className="draft-recovery" role="status">{tr('Brouillon récupéré dans cet onglet. Vérifiez-le puis enregistrez votre dossier.', 'Draft recovered in this tab. Review it, then save your profile.')}</p>}
    <div className="profile-layout"><form className="panel form-panel" onSubmit={event => { event.preventDefault(); void a.run(async () => { await save(form); setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })); }, tr('Votre dossier est enregistré.', 'Your profile has been saved.')); }}>
      <div className="profile-form-heading"><h2>{t("Votre profil")}</h2><div className="profile-ent"><a href="#connexion" className="button profile-ent-button" aria-describedby="profile-ent-notice"><Icon name="school" />{t("Préremplir avec l’ENT")}<Icon name="arrow" /></a><span id="profile-ent-notice">{t("Simulation · aucun compte connecté")}</span></div></div>
      <p>{t("Ces informations apparaîtront aussi dans votre CV. Utilisez des informations fictives pour la démo.")}</p>
      <div className="field-grid">{([['firstname', t('Prénom')], ['lastname', t('Nom')], ['school', t('Établissement')], ['path', t('Parcours / niveau')], ['city', t('Ville')], ['email', t('Adresse e-mail')]] as const).map(([key, label]) => <Field key={key} label={label} value={form[key]} type={key === 'email' ? 'email' : 'text'} onChange={value => setForm({ ...form, [key]: value })} placeholder={label} />)}</div>
      <Field label={t("Ce qui vous intéresse")} multiline value={form.interests} onChange={value => setForm({ ...form, interests: value })} placeholder={tr('Vos envies, vos matières et vos domaines d’intérêt', 'Your interests, subjects and areas you want to explore')} />
      <div className="profile-save-controls"><p role="status">{a.busy ? tr('Enregistrement…', 'Saving…') : dirty ? tr('Modifications non enregistrées', 'Unsaved changes') : savedAt ? tr('Enregistré à ', 'Saved at ') + savedAt : tr('Dossier enregistré', 'Profile saved')}</p><button className="button" disabled={a.busy || !dirty}><Icon name="check" />{t("Enregistrer mon dossier")}</button></div>
      {dirty && <p className="draft-explanation">{tr('Votre brouillon reste dans cet onglet pendant la navigation. La récupération après rechargement dépend du stockage du navigateur. Enregistrez pour mettre à jour les informations utilisées dans votre CV.', 'Your draft stays in this tab as you navigate. Recovery after refresh depends on browser storage. Save to update the information used in your CV.')}</p>}{a.feedback}
    </form><aside className="note"><Icon name="file" /><h3>{t("Votre parcours a des choses à dire.")}</h3><p>{t("Vos expériences, vos projets et vos engagements trouvent leur place dans votre CV.")}</p><Button04 href="#cv" text={t("Construire mon CV")} /></aside></div>
    <section className="section-space documents-empty"><h2>{t("Les pièces du dossier")}</h2><p>{tr('Aucun dépôt de document n’est connecté à un établissement dans cette démonstration. Consultez les pièces demandées et les consignes dans votre dossier officiel Parcoursup ou sur le site de la formation.', 'Document submission is not connected to an institution in this demonstration. Check required documents and instructions in your official Parcoursup application or on the programme website.')}</p><p>{tr('Vous pouvez préparer votre profil et votre CV ici. Les images ajoutées aux récompenses du CV restent des pièces de démonstration et ne sont pas transmises.', 'You can prepare your profile and CV here. Images added to CV awards remain demonstration attachments and are not submitted.')}</p><a className="text-link" href="https://www.parcoursup.gouv.fr/" target="_blank" rel="noreferrer">{tr('Ouvrir le site officiel Parcoursup', 'Open the official Parcoursup website')}<Icon name="arrow" /></a></section>
    <BackupControls onImported={onBackupImported} hasUnsavedWork={hasUnsavedWork || dirty} />
  </>;
}
export function Applications({
  applications
}: {
  applications: Application[];
}) {
  return <><Heading title={t("Gardez le fil de vos candidatures.")}>{t("Un statut compréhensible, une prochaine étape identifiable.")}</Heading>{applications.length ? applications.map(a => <article className="decision-sheet" key={a.id}><div className="section-heading"><h2>{a.formation}</h2><span className="state-label">{a.status === 'published' && a.review ? t(outcomeLabels[a.review.outcome]) : t('En cours d’examen')}</span></div><Workflow steps={[t("Dossier créé"), t("Examen en cours"), t("Réponse partagée")]} current={a.status === "published" ? 3 : 1} /><p>{t("Référence ")}{a.reference}</p><p>{a.status === 'published' ? t('La réponse de l’établissement et son explication sont disponibles.') : t('Votre dossier est en cours de lecture. Vous retrouverez ici la réponse lorsqu’elle sera partagée.')}</p><a href="#decisions" className="text-link">{t("Comprendre ma réponse")}<Icon name="arrow" /></a></article>) : <Empty title={t("Vos prochaines étapes, au même endroit.")} icon="route"><Placeholder>{t("Ici, vos candidatures et leur statut. Ajoutez un dossier fictif depuis l’espace établissement pour essayer le parcours.")}</Placeholder></Empty>}</>;
}
export function Help() {
  return <><Heading title={t("Les bons repères, au bon moment.")}>{t("Un espace pour avancer dans vos démarches et comprendre la démonstration.")}</Heading><div className="support-grid"><section>
    <details className="faq"><summary>{t('Comment utiliser cette démonstration ?')}</summary><p>{tr('Complétez votre profil et votre CV, puis explorez le catalogue public. L’espace professionnel protégé permet de tester des candidatures fictives. Aucune candidature réelle n’est transmise.', 'Complete your profile and CV, then explore the public catalogue. The protected professional workspace lets authorised users test fictional applications. No real application is submitted.')}</p></details>
    <details className="faq"><summary>{t('Où sont enregistrées mes informations ?')}</summary><p>{tr('Les données enregistrées sont liées à votre espace visiteur sur ce serveur. Les brouillons non enregistrés restent dans cet onglet ; leur récupération dépend du stockage du navigateur. Ce n’est pas un compte étudiant récupérable sur un autre appareil. Utilisez des informations fictives et exportez une sauvegarde depuis Mon dossier.', 'Saved data belongs to your visitor workspace on this server. Unsaved drafts stay in this tab; recovery depends on browser storage. This is not a student account recoverable on another device. Use fictional information and export a backup from My profile.')}</p></details>
    <details className="faq waiting-list-help"><summary>{t('Comment lire une liste d’attente ?')}</summary><p>{tr('Votre position dans la liste d’attente évolue avec les désistements. Votre rang dans le classement établi par la formation est fixe : ce sont deux repères différents.', 'Your position on the waiting list changes as other candidates withdraw. Your rank in the programme’s original ranking is fixed: these are two different indicators.')}</p><p>{tr('Le rang du dernier candidat appelé cette année indique jusqu’où les propositions ont été faites au moment de la consultation. Le rang du dernier appelé l’année précédente, lorsqu’il est publié, est un repère historique, jamais une garantie d’admission ni une place disponible en direct.', 'The rank of the last candidate called this year shows how far offers have progressed when you check. Last year’s final called rank, when published, is historical context, never an admission guarantee or a live vacancy count.')}</p><p>{tr('Déclic ne calcule ni rang personnel ni probabilité d’admission. Consultez votre dossier officiel pour votre situation et les délais de réponse.', 'Déclic calculates neither a personal rank nor an admission probability. Check your official application for your status and reply deadlines.')}</p><a className="text-link" href="https://www.parcoursup.gouv.fr/faq/thematiques/fonctionnement-de-parcoursup/recevoir-les-reponses-et-propositions-d-admission" target="_blank" rel="noreferrer">{tr('Source : FAQ officielle Parcoursup', 'Source: official Parcoursup FAQ')}<Icon name="arrow" /></a><p className="help-review-date">{tr('Repères vérifiés le 21 octobre 2026.', 'Guidance reviewed on 21 October 2026.')}</p></details>
    <details className="faq"><summary>{t('Comment fonctionne le relais entre enseignants ?')}</summary><p>{t('Créez un besoin et une disponibilité compatible, vérifiez le profil dans le vivier, puis confirmez l’affectation. Une fois le cours terminé, ses heures peuvent être validées.')}</p></details>
    <details className="faq"><summary>{t('L’ENT est-il connecté ?')}</summary><p>{t('Le bouton ENT simule un préremplissage avec des emplacements modifiables. Aucun accès à un compte scolaire n’est effectué.')}</p></details>
  </section><aside className="note"><Icon name="help" /><h3>{t("Une question mérite une vraie réponse.")}</h3><p>{t("Pour un dossier de démonstration, ouvrez la décision et enregistrez une demande de clarification.")}</p><a className="text-link" href="#decisions">{t("Voir mes décisions")}<Icon name="arrow" /></a></aside></div></>;
}
