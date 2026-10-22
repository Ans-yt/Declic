import { useRef, useState } from 'react';
import { api } from './api';
import { tr } from './i18n';
import { Icon } from './ui';
import { Checkbox } from './components/ui/checkbox';

const LIMIT = 1024 * 1024;
export function BackupControls({ onImported, hasUnsavedWork = false }: { onImported?: () => Promise<void> | void; hasUnsavedWork?: boolean }) {
  const [pending, setPending] = useState<unknown>(null), [filename, setFilename] = useState(''), [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const input = useRef<HTMLInputElement>(null);
  async function chooseFile(file?: File) {
    setError(''); setMessage(''); setPending(null); setConfirmed(false);
    if (!file) return;
    try {
      if (file.size > LIMIT) throw new Error(tr('Le fichier dépasse 1 Mo. Choisissez une sauvegarde plus petite.', 'This file exceeds 1 MB. Choose a smaller backup.'));
      let value: unknown;
      try { value = JSON.parse(await file.text()); } catch { throw new Error(tr('Ce fichier JSON est illisible. Choisissez une sauvegarde Déclic.', 'This JSON file could not be read. Choose a Déclic backup.')); }
      if (!value || typeof value !== 'object' || !('format' in value) || value.format !== 'declic-personal-backup' || !('version' in value) || value.version !== 1) throw new Error(tr('Ce fichier n’est pas une sauvegarde personnelle Déclic compatible.', 'This is not a compatible Déclic personal backup.'));
      setPending(value); setFilename(file.name);
    } catch (e) { setError((e as Error).message); }
    finally { if (input.current) input.current.value = ''; }
  }
  async function exportBackup() {
    setBusy(true); setError(''); setMessage('');
    try {
      const data = await api<unknown>('/backup');
      const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'declic-sauvegarde-' + new Date().toISOString().slice(0, 10) + '.json'; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(tr('Sauvegarde préparée. Conservez ce fichier dans un endroit privé.', 'Backup prepared. Keep this file somewhere private.'));
    } catch { setError(tr('L’export a échoué. Vérifiez votre connexion au serveur et réessayez.', 'Export failed. Check your server connection and try again.')); }
    finally { setBusy(false); }
  }
  return <section className="personal-backup section-space" aria-labelledby="backup-title"><h2 id="backup-title">{tr('Sauvegarder mon espace', 'Back up my workspace')}</h2><p>{tr('Le fichier contient le profil et le CV enregistrés, les favoris et les tâches personnelles. Il exclut les images jointes, les candidatures, les décisions et les données professionnelles.', 'The file contains your saved profile and CV, favourites and personal tasks. It excludes attached images, applications, decisions and professional records.')}</p><p>{hasUnsavedWork ? tr('Des modifications ne sont pas enregistrées : enregistrez-les avant l’export pour les inclure.', 'You have unsaved changes: save them before exporting to include them.') : tr('Les brouillons de cet onglet ne sont pas inclus. Ce fichier permet une restauration manuelle ; il ne crée pas de compte.', 'Drafts from this tab are not included. This file supports manual recovery; it does not create an account.')}</p><div className="backup-actions"><button className="button" disabled={busy} onClick={() => void exportBackup()}><Icon name="file"/>{tr('Exporter mes données', 'Export my data')}</button><label className="backup-file-label">{tr('Choisir une sauvegarde JSON (1 Mo max.)', 'Choose a JSON backup (1 MB max.)')}<input ref={input} type="file" accept=".json,application/json" disabled={busy} onChange={event => void chooseFile(event.target.files?.[0])}/></label></div>{pending !== null && <form className="backup-confirm" onSubmit={event => { event.preventDefault(); if (!confirmed || busy) return; setBusy(true); setError(''); void (async () => { try { await api('/backup', 'POST', pending); setPending(null); setMessage(tr('Sauvegarde importée.', 'Backup imported.')); try { if (onImported) await onImported(); else window.location.reload(); } catch { setError(tr('L’import a réussi, mais l’affichage n’a pas pu être actualisé. Rechargez la page pour retrouver les données importées.', 'Import succeeded, but the page could not refresh. Reload the page to see your imported data.')); } } catch { setError(tr('L’import a échoué. Vérifiez le fichier et réessayez ; vos données restent disponibles.', 'Import failed. Check the file and try again; your data remains available.')); } finally { setBusy(false); } })(); }}><h3>{tr('Vérifier avant de remplacer', 'Review before replacing')}</h3><p className="backup-filename">{filename}</p><p>{tr('L’import remplacera le profil, le CV, les favoris et les tâches de cet espace.', 'Import will replace the profile, CV, favourites and tasks in this workspace')}</p>{hasUnsavedWork && <p className="backup-warning">{tr('Vos modifications non enregistrées seront également remplacées. Exportez vos données enregistrées et conservez vos textes avant de continuer.', 'Your unsaved changes will also be replaced. Export your saved data and keep a copy of your text before continuing.')}</p>}<label className="backup-consent"><Checkbox checked={confirmed} onCheckedChange={value => setConfirmed(value === true)} disabled={busy}/>{tr('Je confirme le remplacement de mes données et de mes brouillons.', 'I confirm replacement of my data and drafts.')}</label><div className="backup-actions"><button className="button" disabled={!confirmed || busy}>{busy ? tr('Import en cours…', 'Importing…') : tr('Remplacer mon espace', 'Replace my workspace')}</button><button className="text-link" type="button" disabled={busy} onClick={() => { setPending(null); setConfirmed(false); }}>{tr('Annuler', 'Cancel')}</button></div></form>}{error && <p role="alert" className="inline-error">{error}</p>}{message && <p role="status">{message}</p>}</section>;
}
