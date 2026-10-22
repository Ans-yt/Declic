import { useEffect, useState } from 'react';
import type { Planner } from '../shared/models';
import type { Formation } from '../shared/catalogue';
import type { Mutate } from './Admissions';
import { DateInput } from './components/Controls';
import { Checkbox } from './components/ui/checkbox';
import { tr } from './i18n';
import { Icon, useAction } from './ui';

export function escapeCalendarText(value: string) { return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,'); }
function calendarLine(value: string) {
  const lines: string[] = []; let line = '', bytes = 0;
  for (const character of value) { const size = new TextEncoder().encode(character).length; if (bytes + size > 75) { lines.push(line); line = ' '; bytes = 1; } line += character; bytes += size; }
  return [...lines, line].join('\r\n');
}
export function personalCalendar(programme: Pick<Formation, 'id' | 'name' | 'institution'>, tasks: Planner['tasks'], now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const events = tasks.filter(task => task.programmeId === programme.id && !task.done && /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)).map(task => [
    'BEGIN:VEVENT', `UID:${task.id}@declic.local`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${task.dueDate.replaceAll('-', '')}`,
    `SUMMARY:${escapeCalendarText(task.title)}`, `DESCRIPTION:${escapeCalendarText(tr('Rappel personnel — date choisie par vous, sans valeur de date limite officielle.', 'Personal reminder — a date you chose, not an official deadline.') + '\n' + programme.name + '\n' + programme.institution)}`, 'END:VEVENT'
  ].map(calendarLine).join('\r\n'));
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Declic//Personal planner//FR', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR', ''].join('\r\n');
}

export function ProgrammePlanner({ programme, planner, mutate }: { programme: Formation; planner: Planner; mutate: Mutate }) {
  const existing = planner.notes.find(note => note.programmeId === programme.id);
  const [note, setNote] = useState(existing?.note || ''), [question, setQuestion] = useState(existing?.question || '');
  const [title, setTitle] = useState(''), [dueDate, setDueDate] = useState('');
  const action = useAction();
  useEffect(() => { setNote(existing?.note || ''); setQuestion(existing?.question || ''); }, [programme.id, existing?.note, existing?.question]);
  const tasks = planner.tasks.filter(task => task.programmeId === programme.id);
  const dirty = note !== (existing?.note || '') || question !== (existing?.question || '');
  const save = (next: Planner) => mutate('/planner', next, 'PUT');
  function download() {
    const url = URL.createObjectURL(new Blob([personalCalendar(programme, tasks)], { type: 'text/calendar;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'declic-rappels-personnels.ics'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <details className="programme-planner"><summary><Icon name="bookmark"/>{tr('Mes notes et mes étapes', 'My notes and next steps')}{tasks.length > 0 && <span>{tasks.filter(task => task.done).length} / {tasks.length}</span>}<Icon name="plus"/></summary>
    <p className="planner-notice">{tr('Espace personnel. Vos notes, questions et dates ne sont pas transmis aux établissements. Les dates sont vos rappels, pas des échéances officielles.', 'Personal space. Your notes, questions and dates are not sent to institutions. Dates are your reminders, not official deadlines.')}</p>
    <form onSubmit={event => { event.preventDefault(); void action.run(() => save({ ...planner, notes: [...planner.notes.filter(item => item.programmeId !== programme.id), { programmeId: programme.id, note, question }] }), tr('Notes enregistrées.', 'Notes saved.')); }}>
      <label className="field">{tr('Pourquoi cette formation m’intéresse', 'Why this programme interests me')}<textarea maxLength={3000} rows={3} value={note} onChange={event => setNote(event.target.value)}/></label>
      <label className="field">{tr('Ma question à poser', 'My question to ask')}<textarea maxLength={1000} rows={2} value={question} onChange={event => setQuestion(event.target.value)}/></label>
      <div className="planner-save"><button className="button" disabled={action.busy || !dirty}>{tr('Enregistrer mes notes', 'Save my notes')}</button><span role="status">{dirty ? tr('Modifications non enregistrées', 'Unsaved changes') : existing ? tr('Notes enregistrées', 'Notes saved') : ''}</span></div>
    </form>
    <h3>{tr('Mes prochaines étapes', 'My next steps')}</h3>
    {!tasks.length && <p className="planner-notice">{tr('Ajoutez une visite, une question à préparer ou une pièce à vérifier.', 'Add a visit, a question to prepare or a document to check.')}</p>}
    <ul className="planner-tasks">{tasks.map(task => <li key={task.id}><label><Checkbox checked={task.done} disabled={action.busy} onCheckedChange={done => void action.run(() => save({ ...planner, tasks: planner.tasks.map(item => item.id === task.id ? { ...item, done: done === true } : item) }))}/><span>{task.title}{task.dueDate && <small>{tr('Date personnelle : ', 'Personal date: ')}<time dateTime={task.dueDate}>{task.dueDate}</time></small>}</span></label><button type="button" className="planner-remove" disabled={action.busy} aria-label={tr('Supprimer l’étape : ', 'Delete step: ') + task.title} onClick={() => void action.run(() => save({ ...planner, tasks: planner.tasks.filter(item => item.id !== task.id) }))}><Icon name="close"/></button></li>)}</ul>
    <form className="planner-task-form" onSubmit={event => { event.preventDefault(); if (!title.trim()) return; void action.run(async () => { await save({ ...planner, tasks: [...planner.tasks, { id: crypto.randomUUID(), programmeId: programme.id, title: title.trim(), dueDate, done: false }] }); setTitle(''); setDueDate(''); }, tr('Étape ajoutée.', 'Step added.')); }}>
      <label className="field">{tr('Nouvelle étape', 'New step')}<input value={title} maxLength={300} required onChange={event => setTitle(event.target.value)}/></label>
      <label className="field">{tr('Date personnelle (facultative)', 'Personal date (optional)')}<DateInput value={dueDate} onValueChange={setDueDate}/></label>
      <button className="button" disabled={action.busy || planner.tasks.length >= 200}><Icon name="plus"/>{tr('Ajouter', 'Add')}</button>
    </form>
    {tasks.some(task => !task.done && task.dueDate) && <button className="text-link planner-calendar" type="button" onClick={download}><Icon name="calendar"/>{tr('Exporter mes rappels (.ics)', 'Export my reminders (.ics)')}</button>}{action.feedback}
  </details>;
}
