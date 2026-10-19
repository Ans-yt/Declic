import { subjects, subjectImage, subjectRoute } from './subjects';
import { getLanguage, tr } from './i18n';
import { Icon } from './ui';
import { HoverTransition } from './components/Controls';
export function SubjectCards() {
  const language = getLanguage();
  return <details className="subject-browser"><summary>{tr('Explorer par domaine', 'Explore by subject')}<Icon name="plus"/></summary><div className="subject-card-grid">{subjects.map(s => <HoverTransition key={s.id} image={subjectImage(s.id)} title={language === 'fr' ? s.fr : s.en} detail={s.detail[language === 'fr' ? 0 : 1]} href={subjectRoute(s.id)}/>)}</div></details>;
}
