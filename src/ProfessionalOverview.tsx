import type { Workspace } from '../shared/models';
import type { Mutate } from './Admissions';
import { getLanguage, tr } from './i18n';
import { useAction } from './ui';

export function ProfessionalOverview({data}: {data:Workspace}) {
  const pending = data.applications.filter(a => a.status !== 'published').length;
  const unanswered = data.applications.reduce((sum,a) => sum + a.questions.filter(q => !q.answer).length,0);
  const open = data.needs.filter(n => n.status === 'open').length;
  return <nav className="professional-overview" aria-label={tr('À traiter dans la démonstration', 'To do in this demo')}>
    <a href="#admissions"><strong>{pending}</strong> {tr('dossiers à examiner', 'applications to review')}</a>
    <a href="#admissions"><strong>{unanswered}</strong> {tr('questions sans réponse', 'unanswered questions')}</a>
    <a href="#remplacements"><strong>{open}</strong> {tr('remplacements à pourvoir', 'unfilled cover needs')}</a>
  </nav>;
}
export function GuidedDemo({data,mutate}: {data:Workspace;mutate:Mutate}) {
  const action = useAction(), example = data.applications.find(a => a.id === data.demoApplicationId);
  const steps = [tr('Créer un dossier fictif', 'Create a fictional application'), tr('Enregistrer un critère et son explication', 'Save a criterion and its explanation'), tr('Partager la réponse', 'Share the response'), tr('Demander une clarification côté élève', 'Ask for clarification as a student'), tr('Répondre côté établissement', 'Reply as the institution')];
  const completed = example ? [true, !!example.review, example.status === 'published', example.questions.length > 0, example.questions.some(q => !!q.answer)] : steps.map(() => false);
  return <details className="guided-demo"><summary>{tr('Essayer le parcours guidé · données fictives', 'Try the guided journey · fictional data')}</summary>
    <p>{tr('Découvrez les deux côtés du parcours, sans transmettre de candidature réelle. Le scénario reste dans votre espace de démonstration.', 'Explore both sides without submitting a real application. The scenario stays in your demonstration workspace.')}</p>
    <ol>{steps.map((label,i)=><li key={i}>{label}{completed[i] && <strong> — {tr('fait', 'done')}</strong>}</li>)}</ol>
    {example ? <><p><strong>{example.reference}</strong> — {tr('Sélectionnez ce dossier dans la liste ci-dessous. Enregistrez votre lecture avant de partager la réponse.', 'Select this application in the list below. Save your review before sharing the response.')}</p><p>{tr('Après publication, ouvrez Mes décisions dans l’espace élève pour poser une question. Revenez ensuite aux admissions pour y répondre.', 'After publication, open My decisions in the student workspace to ask a question. Return to Applications to reply.')}</p><a className="text-link" href="#decisions">{tr('Voir le côté élève', 'See the student side')}</a></> : <button className="button" disabled={action.busy} onClick={() => void action.run(()=>mutate('/demo/scenario',{language:getLanguage()}))}>{tr('Créer le scénario fictif', 'Create the fictional scenario')}</button>}
    {action.feedback}
  </details>;
}
