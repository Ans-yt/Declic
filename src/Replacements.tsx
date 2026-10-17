import { t, getLanguage, formatNumber } from "./i18n";
import { useState } from 'react';
import { needLabels, type Candidate, type Need } from '../shared/models';
import { Empty, Field, Heading, Icon, Placeholder, Workflow, useAction } from './ui';
import type { Mutate } from './Admissions';
import { api } from './api';
export function Replacements({
  needs,
  candidates,
  mutate
}: {
  needs: Need[];
  candidates: Candidate[];
  mutate: Mutate;
}) {
  const [tab, setTab] = useState<'needs' | 'candidates' | 'hours'>('needs'),
    [creating, setCreating] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [filter, setFilter] = useState('all');
  const current = needs.find(n => n.id === selected);
  const visible = needs.filter(n => filter === 'all' || n.status === filter);
  const totalHours = needs.reduce((total, n) => total + (n.status === 'completed' ? n.hours || 0 : 0), 0);
  return <><Heading title={t("Coordonnez les remplacements.")} action={<button className="button" onClick={() => {
      setCreating(true);
      if (tab === 'hours') setTab('needs');
    }}><Icon name="plus" />{tab === 'candidates' ? t('Ajouter une disponibilité') : t('Créer un besoin')}</button>}>{t("De la demande à l’enregistrement des heures, chaque étape reste visible.")}</Heading>
    <div className="workspace-strip"><span><Icon name="calendar" />{t("Continuité des cours")}</span><p>{t("Espace de démonstration local · Les affectations restent fictives.")}</p></div>
    <div className="work-tabs" aria-label={t("Organisation des remplacements")}>{([['needs', t('Cours à couvrir')], ['candidates', t('Vivier & disponibilités')], ['hours', t('Heures effectuées')]] as const).map(([key, label]) => <button key={key} onClick={() => {
        setTab(key);
        setCreating(false);
      }} aria-pressed={tab === key}>{t(label)}<span>{key === 'needs' ? needs.filter(n => n.status === 'open').length : key === 'candidates' ? candidates.length : needs.filter(n => n.status === 'completed').length}</span></button>)}</div>
    {creating && (tab === 'candidates' ? <CandidateForm mutate={mutate} done={() => setCreating(false)} /> : <NeedForm mutate={mutate} done={() => setCreating(false)} />)}
    {tab === 'needs' && <div className="replacement-layout"><section className="replacement-list"><div className="section-heading"><h2>{t("Les missions")}</h2><select aria-label={t("Filtrer les missions")} value={filter} onChange={e => setFilter(e.target.value)}><option value="all">{t("Tous les états")}</option>{Object.entries(needLabels).map(([v, label]) => <option key={v} value={v}>{t(label)}</option>)}</select></div>{visible.length ? visible.map(need => <button key={need.id} className={'mission-row' + (selected === need.id ? ' selected' : '')} onClick={() => setSelected(need.id)} aria-pressed={selected === need.id}><div className="mission-date"><strong>{new Date(need.date + 'T12:00').getDate()}</strong><span>{new Date(need.date + 'T12:00').toLocaleDateString(getLanguage() === 'fr' ? 'fr-FR' : 'en-GB', {
                month: 'short'
              })}</span></div><div><h3>{need.subject}</h3><p>{need.school} · {need.city}</p><span>{need.start} – {need.end}</span></div><span className={'state-label ' + need.status}>{t(needLabels[need.status])}</span><Icon name="arrow" /></button>) : <Empty title={filter !== 'all' ? t('Aucune mission dans cet état.') : t('Le prochain cours peut continuer.')} icon="calendar" action={<button className="button" onClick={() => setCreating(true)}>{t("Décrire un besoin")}<Icon name="plus" /></button>}><Placeholder>{t("Ici, les cours à couvrir, leurs horaires et leur état de confirmation")}</Placeholder></Empty>}</section><aside className="assignment-desk">{current ? <Assignment key={current.id + current.status} need={current} candidates={candidates} mutate={mutate} /> : <><Icon name="calendar" /><h2>{t("Une mission,")}<br />{t("un suivi clair.")}</h2><p>{t("Sélectionnez un cours pour retrouver les disponibilités compatibles et organiser la suite.")}</p><ol className="replacement-steps"><li><strong>{t("Préciser le besoin")}</strong><span>{t("Matière, lieu et créneau.")}</span></li><li><strong>{t("Vérifier le relais")}</strong><span>{t("Qualification et disponibilité.")}</span></li><li><strong>{t("Confirmer et suivre")}</strong><span>{t("Affectation, puis heures réalisées.")}</span></li></ol></>}</aside></div>}
    {tab === 'candidates' && <section className="roster"><div className="section-heading"><h2>{t("Les personnes disponibles")}</h2><span className="subtle-notice">{t("Vérification manuelle par l’établissement")}</span></div>{candidates.length ? candidates.map(candidate => <CandidateRow key={candidate.id} candidate={candidate} mutate={mutate} />) : <Empty title={t("Un vivier à construire.")} icon="user" action={<button className="button" onClick={() => setCreating(true)}>{t("Ajouter une disponibilité")}<Icon name="plus" /></button>}><Placeholder>{t("Ici, les qualifications, les matières, les lieux et les créneaux proposés")}</Placeholder></Empty>}</section>}
    {tab === 'hours' && <section className="hours-ledger"><div className="section-heading"><h2>{t("Le registre des heures")}</h2><strong>{formatNumber(totalHours)}{t(" h validées")}</strong></div><p>{t("Les heures sont enregistrées ici après confirmation de la mission. Le paiement reste géré par l’établissement.")}</p>{needs.some(n => ['confirmed', 'completed'].includes(n.status)) ? needs.filter(n => ['confirmed', 'completed'].includes(n.status)).map(n => <HoursRow key={n.id + n.status} need={n} candidate={candidates.find(c => c.id === n.candidateId)} mutate={mutate} />) : <Empty title={t("Les missions d’abord, les heures ensuite.")} icon="clock">{t("Les missions confirmées apparaîtront ici pour enregistrer les heures effectuées.")}</Empty>}</section>}
  </>;
}
const blankSlot = {
  subject: '',
  city: '',
  date: '',
  start: '',
  end: ''
};
function SlotFields({
  form,
  update
}: {
  form: typeof blankSlot;
  update: (v: Partial<typeof blankSlot>) => void;
}) {
  return <><div className="field-grid"><Field label={t("Matière")} required value={form.subject} onChange={v => update({
        subject: v
      })} placeholder={t("*Ici, la matière*")} /><Field label={t("Commune")} required value={form.city} onChange={v => update({
        city: v
      })} placeholder={t("*Ici, la commune*")} /></div><div className="slot-fields"><Field label={t("Date")} required type="date" value={form.date} onChange={v => update({
        date: v
      })} /><Field label={t("Début")} required type="time" value={form.start} onChange={v => update({
        start: v
      })} /><Field label={t("Fin")} required type="time" value={form.end} onChange={v => update({
        end: v
      })} /></div></>;
}
function NeedForm({
  mutate,
  done
}: {
  mutate: Mutate;
  done: () => void;
}) {
  const [form, setForm] = useState({
    ...blankSlot,
    school: '',
    notes: ''
  });
  const a = useAction();
  return <form className="workspace-form" onSubmit={e => {
    e.preventDefault();
    void a.run(async () => {
      await mutate('/needs', form);
      done();
    });
  }}><div className="section-heading"><h2>{t("Un cours à couvrir")}</h2><button type="button" className="text-link" onClick={done}>{t("Fermer")}</button></div><Field label={t("Établissement")} required value={form.school} onChange={v => setForm({
      ...form,
      school: v
    })} placeholder={t("*Ici, l’établissement*")} /><SlotFields form={form} update={v => setForm({
      ...form,
      ...v
    })} /><Field label={t("Consignes de continuité pédagogique")} multiline value={form.notes} onChange={v => setForm({
      ...form,
      notes: v
    })} placeholder={t("*Ici, le niveau, le cours à poursuivre et les informations utiles*")} /><button className="button" disabled={a.busy}>{t("Enregistrer le besoin")}<Icon name="check" /></button>{a.feedback}</form>;
}
function CandidateForm({
  mutate,
  done
}: {
  mutate: Mutate;
  done: () => void;
}) {
  const [form, setForm] = useState({
    ...blankSlot,
    name: '',
    qualification: '',
    experience: ''
  });
  const a = useAction();
  return <form className="workspace-form" onSubmit={e => {
    e.preventDefault();
    void a.run(async () => {
      await mutate('/candidates', form);
      done();
    });
  }}><div className="section-heading"><h2>{t("Proposer une disponibilité")}</h2><button type="button" className="text-link" onClick={done}>{t("Fermer")}</button></div><div className="field-grid"><Field label={t("Nom du profil fictif")} required value={form.name} onChange={v => setForm({
        ...form,
        name: v
      })} placeholder={t("*Ici, le nom*")} /><Field label={t("Diplôme / qualification")} required value={form.qualification} onChange={v => setForm({
        ...form,
        qualification: v
      })} placeholder={t("*Ici, la qualification à vérifier*")} /></div><SlotFields form={form} update={v => setForm({
      ...form,
      ...v
    })} /><Field label={t("Expérience pédagogique")} multiline value={form.experience} onChange={v => setForm({
      ...form,
      experience: v
    })} placeholder={t("*Ici, l’expérience et les éléments à vérifier*")} /><p>{t("La disponibilité restera à vérifier avant de permettre une affectation.")}</p><button className="button" disabled={a.busy}>{t("Ajouter au vivier")}<Icon name="check" /></button>{a.feedback}</form>;
}
function CandidateRow({
  candidate: c,
  mutate
}: {
  candidate: Candidate;
  mutate: Mutate;
}) {
  const a = useAction();
  return <article className="candidate-row"><div className="candidate-avatar"><Icon name="user" /></div><div><h3>{c.name}</h3><p>{c.subject} · {c.city}</p><p>{c.qualification}</p><small>{c.date} · {c.start} – {c.end}</small>{c.experience && <p>{c.experience}</p>}</div><div className="candidate-action"><span className={'state-label ' + (c.verified ? 'confirmed' : 'pending')}>{c.verified ? t('Vérifié pour la démo') : t('À vérifier')}</span>{!c.verified && <button className="button" disabled={a.busy} onClick={() => void a.run(() => mutate(`/candidates/${c.id}/verify`, {}), t('Vérification enregistrée pour la démonstration.'))}>{t("Marquer comme vérifié")}</button>}{a.feedback}</div></article>;
}
function Assignment({
  need,
  candidates,
  mutate
}: {
  need: Need;
  candidates: Candidate[];
  mutate: Mutate;
}) {
  const [matches, setMatches] = useState<Candidate[] | null>(null),
    [candidateId, setCandidateId] = useState('');
  const a = useAction();
  const assigned = candidates.find(c => c.id === need.candidateId);
  async function findMatches() {
    const result = await api<{
      candidates: Candidate[];
    }>(`/needs/${need.id}/matches`);
    setMatches(result.candidates);
    setCandidateId('');
  }
  return <><Workflow steps={[t("Demande"), t("Mise en relation"), t("Confirmation"), t("Heures réalisées")]} current={need.status === "completed" ? 4 : need.status === "confirmed" ? 2 : 1} /><div className="section-heading"><h2>{need.subject}</h2><span className={'state-label ' + need.status}>{t(needLabels[need.status])}</span></div><p>{need.school} · {need.city}<br />{need.date} · {need.start} – {need.end}</p>{need.notes && <div className="mission-notes"><h3>{t("Le relais pédagogique")}</h3><p>{need.notes}</p></div>}
    {need.status === 'open' ? <><button className="button" disabled={a.busy} onClick={() => void a.run(findMatches, t('Disponibilités actualisées.'))}><Icon name="search" />{t("Chercher un relais")}</button><p className="subtle-notice">{t("Même matière, commune et date ; créneau couvert ; qualification vérifiée dans la démo.")}</p>{matches && (matches.length ? <form onSubmit={e => {
        e.preventDefault();
        void a.run(() => mutate(`/needs/${need.id}/assign`, {
          candidateId
        }), t('Mission confirmée.'));
      }}><label className="field">{t("Personne disponible")}<select required value={candidateId} onChange={e => setCandidateId(e.target.value)}><option value="">{t("Choisir un profil")}</option>{matches.map(c => <option key={c.id} value={c.id}>{c.name} · {c.qualification}</option>)}</select></label><button className="button" disabled={a.busy}>{t("Confirmer l’affectation")}<Icon name="check" /></button></form> : <p className="match-empty">{t("Aucun relais compatible pour ce créneau. Ajoutez ou vérifiez une disponibilité dans le vivier.")}</p>)}</> : assigned && <div className="assigned-person"><Icon name="user" /><div><strong>{assigned.name}</strong><p>{assigned.qualification}</p><span>{need.status === 'completed' ? t("Heures validées : {hours}", { hours: need.hours || 0 }) : t('Mission confirmée')}</span></div></div>}
    {['open', 'confirmed'].includes(need.status) && <button className="text-link cancel-mission" disabled={a.busy} onClick={() => void a.run(() => mutate(`/needs/${need.id}/cancel`, {}), t('Mission annulée, conservée dans l’historique.'))}>{t("Annuler cette mission")}</button>}{a.feedback}</>;
}
function HoursRow({
  need,
  candidate,
  mutate
}: {
  need: Need;
  candidate?: Candidate;
  mutate: Mutate;
}) {
  const [hours, setHours] = useState('');
  const a = useAction();
  return <div className="hours-row"><div><strong>{need.subject} · {candidate?.name}</strong><p>{need.school} · {need.date} · {need.start} – {need.end}</p></div>{need.status === 'completed' ? <span className="state-label completed">{need.hours}{t(" h validées")}</span> : <form onSubmit={e => {
      e.preventDefault();
      void a.run(() => mutate(`/needs/${need.id}/hours`, {
        hours: Number(hours)
      }), t('Heures validées.'));
    }}><Field label={t("Heures réalisées")} type="number" required min="0.25" max="24" step="0.25" value={hours} onChange={setHours} /><button className="button" disabled={a.busy}>{t("Valider les heures")}</button>{a.feedback}</form>}</div>;
}
