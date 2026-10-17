import { useRef, useState, useEffect } from 'react';
import type { Award } from '../shared/models';
import { api } from './api';
import { Field, Icon } from './ui';
import { tr, t } from './i18n';
import { suggestAwardTitle } from '../shared/award-title';

export function AwardsEditor({ awards, savedAwards, onChange }: { awards: Award[]; savedAwards: Award[]; onChange: (v: Award[]) => void }) {
  const [busy, setBusy] = useState(false), [dragging, setDragging] = useState(false), [error, setError] = useState(''), [scanning, setScanning] = useState<string | null>(null), [progress, setProgress] = useState(0), [suggestion, setSuggestion] = useState<{ id: string; title: string } | null>(null);
  const input = useRef<HTMLInputElement>(null), current = useRef(awards), mounted = useRef(true), workerRef = useRef<{ terminate: () => Promise<unknown> } | null>(null);
  current.current = awards;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; void workerRef.current?.terminate(); }; }, []);
  function patch(id: string, value: Partial<Award>) { onChange(current.current.map(a => a.id === id ? { ...a, ...value } : a)); }
  async function remove(award: Award) {
    onChange(current.current.filter(a => a.id !== award.id));
    if(award.attachmentId && !savedAwards.some(a => a.attachmentId === award.attachmentId)) { try { await api('/attachments/'+award.attachmentId,'DELETE'); } catch { /* A concurrent save may have referenced it; retain the proof in that case. */ } }
  }
  async function addImage(file?: File) {
    if (!file || busy || current.current.length >= 20) return;
    setError('');
    if (file.size > 8 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError(tr('Choisissez un PNG, JPEG ou WebP de 8 Mo maximum.', 'Choose a PNG, JPEG or WebP up to 8 MB.')); return; }
    setBusy(true);
    try {
      const body = new FormData(); body.append('image', file);
      const response = await fetch('/api/attachments', { method: 'POST', body }); const result = await response.json();
      if (!response.ok) throw new Error(t(result.error));
      if (!mounted.current) { await api('/attachments/' + result.id, 'DELETE'); return; }
      onChange([...current.current, { id: crypto.randomUUID(), title: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g,' ').trim().slice(0,300) || tr('Mon diplôme', 'My diploma'), organization: '', date: '', detail: '', attachmentId: result.id }]);
    } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : tr('Envoi impossible. Réessayez.', 'Upload failed. Try again.')); }
    finally { if (mounted.current) setBusy(false); if (input.current) input.current.value = ''; }
  }
  async function scan(award: Award) {
    if (!award.attachmentId || scanning) return;
    setScanning(award.id); setProgress(0); setError(''); setSuggestion(null);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(['fra', 'eng'], 1, { workerPath: '/assets/vendor/ocr/worker.min.js', corePath: '/assets/vendor/ocr', langPath: '/assets/ocr', logger: message => { if (mounted.current && message.status === 'recognizing text') setProgress(Math.round(message.progress * 100)); } });
      workerRef.current = worker;
      if (!mounted.current) { await worker.terminate(); return; }
      const result = await worker.recognize('/api/attachments/' + award.attachmentId, {}, { text: true });
      const title = suggestAwardTitle(result.data.text);
      if (mounted.current) { if (title) setSuggestion({ id: award.id, title }); else setError(tr('Aucun titre fiable détecté. Vous pouvez le saisir vous-même.', 'No reliable title was detected. You can enter it yourself.')); }
    } catch { if (mounted.current) setError(tr('Lecture automatique indisponible. Nommez le document manuellement.', 'Automatic reading is unavailable. Name the document manually.')); }
    finally { await workerRef.current?.terminate().catch(() => {}); workerRef.current = null; if (mounted.current) setScanning(null); }
  }
  return <div className="awards-editor">
    <p className="award-intro">{tr('Diplôme, BIA, prix ou participation à un concours : donnez une place à ce que vous avez accompli.', 'A diploma, aviation certificate, competition prize or participation award: show what you have achieved.')}</p>
    <div className={'award-dropzone' + (dragging ? ' dragging' : '')} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length > 1) setError(tr('Ajoutez une image à la fois.', 'Add one image at a time.')); else void addImage(e.dataTransfer.files[0]); }}>
      <Icon name="upload"/><strong>{tr('Glissez une image de votre réussite.', 'Drop an image of your achievement.')}</strong><span>{tr('PNG, JPEG ou WebP · 8 Mo maximum', 'PNG, JPEG or WebP · Up to 8 MB')}</span>
      <input ref={input} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" aria-label={tr('Ajouter une image de diplôme ou récompense', 'Add a diploma or award image')} disabled={busy || awards.length >= 20} onChange={e => void addImage(e.target.files?.[0])}/>
      <button type="button" className="button" disabled={busy || awards.length >= 20} onClick={() => input.current?.click()}>{busy ? tr('Envoi de l’image…', 'Uploading image…') : tr('Choisir une image', 'Choose an image')}</button>
    </div>
    <p className="award-privacy">{tr('Images privées dans votre espace. Le nom du fichier propose un premier titre, toujours modifiable. Enregistrez ensuite votre CV.', 'Images are private to your workspace. The filename suggests an initial title that you can edit. Save your CV afterwards.')}</p>
    {error && <p className="inline-error" role="alert">{error}</p>}
    {awards.map((award, i) => <section className="award-entry" key={award.id}>
      <div className="section-heading"><h3>{tr('Réussite', 'Achievement')} {i + 1}</h3><button type="button" className="text-link" disabled={busy || scanning === award.id} onClick={() => void remove(award)}>{tr('Retirer du CV', 'Remove from CV')}</button></div>
      {award.attachmentId && <a href={'/api/attachments/' + award.attachmentId} target="_blank" rel="noopener noreferrer" className="award-proof"><img src={'/api/attachments/' + award.attachmentId} alt={award.title} loading="lazy"/><span>{tr('Ouvrir l’image', 'Open image')}<Icon name="arrow"/></span></a>}
      <Field label={tr('Nom du diplôme ou de la récompense', 'Diploma or award name')} required value={award.title} onChange={title => patch(award.id, { title })} placeholder={tr('Ex. Brevet d’initiation aéronautique (BIA)', 'E.g. Aviation initiation certificate (BIA)')}/>
      <div className="field-grid"><Field label={tr('Organisme', 'Awarding organisation')} value={award.organization} onChange={organization => patch(award.id, { organization })}/><Field label={tr('Date ou année', 'Date or year')} value={award.date} onChange={date => patch(award.id, { date })}/></div>
      <Field label={tr('Ce que cette réussite représente', 'What this achievement means')} multiline value={award.detail} onChange={detail => patch(award.id, { detail })}/>
      {award.attachmentId && <div className="award-ocr"><button type="button" className="text-link" disabled={scanning !== null} onClick={() => void scan(award)}><Icon name="search"/>{scanning === award.id ? `${tr('Lecture en cours', 'Reading image')}… ${progress} %` : tr('Suggérer un titre depuis l’image', 'Suggest a title from the image')}</button><small>{tr('Lecture facultative sur votre appareil. Le moteur se charge au premier clic ; vérifiez toujours la suggestion.', 'Optional reading on your device. The engine loads on first use; always check its suggestion.')}</small></div>}
      {suggestion?.id === award.id && <div className="ocr-suggestion"><span>{suggestion.title}</span><button type="button" className="text-link" onClick={() => { patch(award.id,{ title: suggestion.title }); setSuggestion(null); }}>{tr('Utiliser ce titre', 'Use this title')}</button><button type="button" className="text-link" onClick={() => setSuggestion(null)}>{tr('Ignorer', 'Dismiss')}</button></div>}
    </section>)}
    <button className="button" type="button" disabled={awards.length >= 20 || busy} onClick={() => onChange([...current.current, { id: crypto.randomUUID(), title: '', organization: '', date: '', detail: '', attachmentId: null }])}><Icon name="plus"/>{tr('Ajouter sans image', 'Add without an image')}</button>
    {awards.length >= 20 && <p>{tr('20 réussites maximum par CV.', 'Up to 20 achievements per CV.')}</p>}
  </div>;
}
