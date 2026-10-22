import { t, tr } from "./i18n";
import { useEffect, useState } from 'react';
import { AwardsEditor } from './AwardsEditor';
import type { CV, CVEntry, Profile, Section } from '../shared/models';
import { Field, Heading, Icon, Placeholder, Sticker, useAction } from './ui';
const labels = {
  presentation: 'Mon projet',
  education: 'Formation',
  experience: 'Expériences',
  engagement: 'Engagements',
  skills: 'Compétences',
  languages: 'Langues',
  awards: 'Diplômes & récompenses'
};
type Tab = keyof typeof labels;
const descriptions: Record<Tab, string> = {
  presentation: 'Quelques mots pour donner envie de vous rencontrer.',
  education: 'Votre cursus, vos spécialités, vos diplômes.',
  experience: 'Stages, emplois et projets personnels.',
  engagement: 'Associations, bénévolat et responsabilités.',
  skills: 'Ce que vous savez faire.',
  languages: 'Les langues que vous pratiquez et vos niveaux.',
  awards: 'Diplômes, prix, certificats et concours.'
};
const entryKeys: Section[] = ['education', 'experience', 'engagement'];
const tokens = (value: string) => value.split(/\n|,/).map(s => s.trim()).filter(Boolean);
export function CVEditor({
  cv,
  savedCV,
  setCV,
  profile,
  save,
  recovered = false
}: {
  cv: CV;
  savedCV: CV;
  setCV: (v: CV) => void;
  profile: Profile;
  save: (cv: CV) => Promise<void>;
  recovered?: boolean;
}) {
  const [active, setActive] = useState<Tab | null>(null),
    [preview, setPreview] = useState(true);
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  useEffect(() => {
    function openSection() {
      const section = location.hash.replace(/^#cv\/?/, '').split('?')[0];
      if (Object.hasOwn(labels, section)) { setActive(section as Tab); setMobileView('edit'); }
    }
    openSection();
    window.addEventListener('hashchange', openSection);
    return () => window.removeEventListener('hashchange', openSection);
  }, []);
  const dirty = JSON.stringify(cv) !== JSON.stringify(savedCV),
    action = useAction();
  const filled = [!!cv.title.trim() && !!cv.about.trim(), ...entryKeys.map(key => cv[key].some(e => e.title.trim())), !!cv.skills.trim(), !!cv.languages.trim(), cv.awards.length > 0].filter(Boolean).length;
  function changeEntry(section: Section, id: string, patch: Partial<CVEntry>) {
    setCV({
      ...cv,
      [section]: cv[section].map(e => e.id === id ? {
        ...e,
        ...patch
      } : e)
    });
  }
  function summary(key: Tab) {
    if (key === 'awards') return cv.awards.length ? <div className="cv-summary-awards">{cv.awards.map(a => <p className="cv-summary-entry" key={a.id}>{a.title || tr('Réussite à nommer', 'Name this achievement')}{a.attachmentId && <Icon name="file"/>}</p>)}</div> : <div className="cv-summary-empty"><Placeholder>{tr('Ici, vos diplômes et récompenses', 'Your diplomas and awards go here')}</Placeholder></div>;
    if (key === 'education' || key === 'experience' || key === 'engagement') {
      const entries = cv[key as Section];
      return entries.some(e => e.title.trim()) ? entries.filter(e => e.title.trim()).map(e => <p key={e.id} className="cv-summary-entry">{[e.title, e.organization, e.period].filter(Boolean).join(' · ')}</p>) : <div className="cv-summary-empty"><Placeholder>{t(key === "education" ? "Ici, vos formations" : key === "experience" ? "Ici, vos expériences" : "Ici, vos engagements")}</Placeholder></div>;
    }
    if (key === 'presentation') return <p className="cv-summary-entry">{cv.title || <Placeholder>{t("Ici, votre projet et votre présentation")}</Placeholder>}</p>;
    return cv[key].trim() ? <div className="skill-chips">{tokens(cv[key]).map((value, i) => <span key={i}>{value}</span>)}</div> : <div className="cv-summary-empty"><Placeholder>{t(key === "skills" ? "Ici, vos savoir-faire" : "Ici, vos langues et niveaux")}</Placeholder></div>;
  }
  function editor(key: Tab) {
    if (key === 'awards') return <AwardsEditor awards={cv.awards} savedAwards={savedCV.awards} onChange={awards => setCV({ ...cv, awards })}/>;
    if (key === 'presentation') return <><div className="identity-slip"><Icon name="user" /><div><strong>{[profile.firstname, profile.lastname].filter(Boolean).join(' ') || <Placeholder>{t("Votre prénom et votre nom")}</Placeholder>}</strong><small>{profile.school || <Placeholder>{t("Votre établissement")}</Placeholder>}</small></div><a href="#dossier" className="text-link">{t("Modifier")}</a></div><Field label={t("Titre du CV")} value={cv.title} onChange={v => setCV({
        ...cv,
        title: v
      })} placeholder={t("*Ici, votre projet ou l’opportunité recherchée*")} /><Field label={t("Quelques mots sur vous")} multiline value={cv.about} onChange={v => setCV({
        ...cv,
        about: v
      })} placeholder={t("*Ici, ce qui vous motive et ce que vous souhaitez apprendre*")} /></>;
    if (key === 'skills' || key === 'languages') return <Field label={key === 'skills' ? t('Compétences') : t('Langues et niveaux')} multiline value={cv[key]} onChange={v => setCV({
      ...cv,
      [key]: v
    })} placeholder={key === 'skills' ? '*Ici, vos compétences, une par ligne*' : '*Ici, vos langues et niveaux, un par ligne*'} />;
    return <>{cv[key].map((entry, i) => <section className="entry-editor" key={entry.id}><div className="section-heading"><h3>{entry.title || t("Élément {number}", { number: i + 1 })}</h3><button type="button" className="text-link" onClick={() => setCV({
            ...cv,
            [key]: cv[key].filter(e => e.id !== entry.id)
          })} aria-label={t("Retirer l’élément {number}", { number: i + 1 })}>{t("Retirer")}</button></div><Field label={key === 'education' ? t('Cursus ou diplôme') : t('Intitulé')} value={entry.title} onChange={v => changeEntry(key, entry.id, {
          title: v
        })} placeholder={t("*Ici, l’intitulé*")} /><div className="field-grid"><Field label={t("Établissement / organisation")} value={entry.organization} onChange={v => changeEntry(key, entry.id, {
            organization: v
          })} placeholder={t("*Ici, le lieu*")} /><Field label={t("Période")} value={entry.period} onChange={v => changeEntry(key, entry.id, {
            period: v
          })} placeholder={t("*Ici, les dates*")} /></div><Field label={t("Ce que vous avez fait ou appris")} multiline value={entry.detail} onChange={v => changeEntry(key, entry.id, {
          detail: v
        })} placeholder={t("*Ici, vos réalisations et apprentissages*")} /><button type="button" className="text-link" disabled={i === 0} onClick={() => {
          const next = [...cv[key]];
          [next[i - 1], next[i]] = [next[i], next[i - 1]];
          setCV({
            ...cv,
            [key]: next
          });
        }}>{t("Monter dans le CV")}</button></section>)}<button className="button add-entry" type="button" disabled={cv[key].length >= 30} onClick={() => setCV({
        ...cv,
        [key]: [...cv[key], {
          id: crypto.randomUUID(),
          title: '',
          organization: '',
          period: '',
          detail: ''
        }]
      })}><Icon name="plus" />{t("Ajouter ")}{key === 'education' ? t('une formation') : key === 'experience' ? t('une expérience') : t('un engagement')}</button></>;
  }
  return <><Heading title={t("Votre CV, pas à pas.")} action={<button className="button" onClick={() => window.print()}><Icon name="print" />{t("Imprimer / PDF")}</button>}>{t("Remplissez une rubrique à la fois : l’aperçu se met à jour en direct.")}</Heading>{recovered && dirty && <p className="draft-recovery" role="status">{tr('Brouillon récupéré dans cet onglet. Vérifiez votre CV puis enregistrez-le.', 'Draft recovered in this tab. Review your CV, then save it.')}</p>}<div className="cv-command cv-review-command"><div className="cv-save-status" role="status"><span className="status-dot" />{action.busy ? tr('Enregistrement…', 'Saving…') : dirty ? tr('Modifications non enregistrées', 'Unsaved changes') : savedAt ? tr('Enregistré à ', 'Saved at ') + savedAt : tr('CV enregistré', 'CV saved')}</div><div className="cv-mode-switch" role="group" aria-label={tr('Vue du CV', 'CV view')}><button type="button" aria-pressed={mobileView === 'edit'} onClick={() => setMobileView('edit')}>{tr('Modifier', 'Edit')}</button><button type="button" aria-pressed={mobileView === 'preview'} onClick={() => setMobileView('preview')}>{tr('Aperçu', 'Preview')}</button></div><button type="button" className="text-link cv-desktop-preview" onClick={() => setPreview(!preview)} aria-expanded={preview} aria-controls="document-preview">{preview ? t('Masquer') : t('Afficher')}{t(" l’aperçu")}<Icon name="file" /></button><button form="cv-edit-form" className="button" disabled={action.busy || !dirty}><Icon name="check" />{t('Enregistrer mon CV')}</button><div className="cv-save-feedback">{action.feedback}</div></div>{dirty && <p className="draft-explanation">{tr('La récupération du brouillon dans cet onglet dépend du stockage du navigateur. Enregistrez pour conserver ces changements sur le serveur.', 'Draft recovery in this tab depends on browser storage. Save to keep these changes on the server.')}</p>}<div className={'cv-workbench cv-kit-workbench mobile-cv-' + mobileView + (preview ? '' : ' no-preview')}><form id="cv-edit-form" className="cv-accordion-form" onSubmit={event => { event.preventDefault(); void action.run(async () => { await save(cv); setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })); }, tr('Votre CV est enregistré.', 'Your CV has been saved.')); }}><section className="cv-outline"><div className="cv-progress"><span>{t("Rubriques renseignées : {count} / 7", { count: filled })}</span><span className="cv-optional-note">{tr('Complétez les rubriques utiles à votre projet.', 'Complete the sections relevant to your plans.')}</span><span className="cv-progress-bars" aria-hidden="true">{Array.from({
                length: 7
              }, (_, i) => <i key={i} className={i < filled ? 'filled' : ''} />)}</span></div>{Object.entries(labels).map(([name, label]) => {
            const key = name as Tab,
              open = active === key;
            return <section className={'cv-outline-section' + (open ? ' expanded' : '')} key={key}><button className="cv-section-trigger" type="button" aria-expanded={open} aria-controls={'cv-edit-' + key} onClick={() => setActive(open ? null : key)}><span><strong>{t(label)}</strong><small>{t(descriptions[key])}{(['experience', 'engagement', 'awards'] as Tab[]).includes(key) && <span className="cv-optional">{tr(' · Facultatif', ' · Optional')}</span>}</small></span><span className="cv-section-action">{open ? t('Refermer') : t('Modifier')}<Icon name={open ? 'close' : 'arrow'} /></span></button>{!open && summary(key)}<div id={'cv-edit-' + key} hidden={!open} className="cv-section-fields">{open && editor(key)}</div></section>;
          })}</section></form><aside id="document-preview" className={'document-preview cv-kit-preview' + (preview ? '' : ' preview-off')}><div className="preview-caption"><span>{t("Aperçu de votre CV")}</span><span className="state-label">{t("Brouillon")}</span></div><Sticker name="star" className="cv-kit-sticker" /><CVSheet cv={cv} profile={profile} /><p className="preview-note">{t("Les rubriques vides sont masquées à l’impression.")}</p></aside></div></>;
}
function CVSheet({
  cv,
  profile
}: {
  cv: CV;
  profile: Profile;
}) {
  return <article className="cv-document"><header><h2>{[profile.firstname, profile.lastname].filter(Boolean).join(' ') || <Placeholder>{t("Votre prénom et nom")}</Placeholder>}</h2><p className="document-title">{cv.title || <Placeholder>{t("Votre projet, votre direction")}</Placeholder>}</p><p className="document-contact">{[profile.school, profile.city, profile.email].filter(Boolean).join(' · ') || <Placeholder>{t("Établissement · Ville · Contact")}</Placeholder>}</p></header><section className={!cv.about ? 'print-empty' : ''}><h3>{t("Mon projet")}</h3><p>{cv.about || <Placeholder>{t("Quelques mots sur vous et votre projet")}</Placeholder>}</p></section>{entryKeys.map(key => <section key={key} className={!cv[key].some(e => e.title || e.detail) ? 'print-empty' : ''}><h3>{t(labels[key])}</h3>{cv[key].length ? cv[key].map(entry => <div className="document-entry" key={entry.id}><div><strong>{entry.title || <Placeholder>{t("Intitulé")}</Placeholder>}</strong><small>{entry.period}</small></div><span>{entry.organization}</span><p>{entry.detail}</p></div>) : <p><Placeholder>{t(key === "education" ? "Ici, vos formations" : key === "experience" ? "Ici, vos expériences" : "Ici, vos engagements")}</Placeholder></p>}</section>)}{(['skills', 'languages'] as const).map(key => <section key={key} className={!cv[key].trim() ? 'print-empty' : ''}><h3>{t(labels[key])}</h3>{cv[key].trim() ? <div className="skill-chips">{tokens(cv[key]).map((value, i) => <span key={i}>{value}</span>)}</div> : <p><Placeholder>{key === 'skills' ? t('Vos savoir-faire') : t('Vos langues et niveaux')}</Placeholder></p>}</section>)}{cv.awards.length > 0 && <section className="document-awards"><h3>{tr('Diplômes & récompenses', 'Diplomas & awards')}</h3>{cv.awards.map(a => <div className="document-entry" key={a.id}><div><strong>{a.title || tr('Réussite à nommer', 'Name this achievement')}</strong><small>{a.date}</small></div><span>{a.organization}</span><p>{a.detail}</p>{a.attachmentId && <img className="document-award-image" src={'/api/attachments/' + a.attachmentId} alt={a.title} loading="lazy"/>}</div>)}</section>}</article>;
}
