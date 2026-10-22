import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { blankCV, type CV } from '../shared/models';
import { Home, nextCVSection } from '../src/Home';
import { Decisions } from '../src/Decisions';
import { setLanguage } from '../src/i18n';
import { Field, Placeholder } from '../src/ui';

test('empty display copy and field hints omit template asterisks while preserving user values', () => {
  setLanguage('en');
  assert.equal(renderToStaticMarkup(<Placeholder>Votre prénom et nom</Placeholder>).includes('*'), false);
  const markup = renderToStaticMarkup(<Field label="Titre du CV" value="*Mon titre personnel*" onChange={() => {}} placeholder="*Votre prénom*"/>);
  assert.ok(markup.includes('value="*Mon titre personnel*"'));
  assert.ok(markup.includes('placeholder="Your first name"'));
  setLanguage('fr');
});

const completeCV: CV = {
  ...blankCV,
  title: 'Mon projet',
  about: 'Ce que je souhaite apprendre.',
  education: [{ id: 'example', title: 'Baccalauréat', organization: '', period: '', detail: '' }],
  skills: 'Rédaction',
  languages: 'Français',
};

test('home recommends the first missing essential and ignores optional experience, activities and awards', () => {
  assert.equal(nextCVSection(blankCV), 'presentation');
  assert.equal(nextCVSection({ ...completeCV, title: ' ' }), 'presentation');
  assert.equal(nextCVSection({ ...completeCV, about: '\n ' }), 'presentation');
  assert.equal(nextCVSection({ ...completeCV, education: [{ ...completeCV.education[0], title: ' ' }] }), 'education');
  assert.equal(nextCVSection({ ...completeCV, skills: ' ' }), 'skills');
  assert.equal(nextCVSection({ ...completeCV, languages: ' ' }), 'languages');
  assert.equal(nextCVSection(completeCV), null);
});

test('home opens the recommended section and offers review/export after essentials are complete in both languages', () => {
  for (const language of ['fr', 'en'] as const) {
    setLanguage(language);
    const missing = renderToStaticMarkup(<Home cv={{ ...completeCV, skills: '' }}/>);
    assert.ok(missing.includes('href="#cv/skills"'));
    const complete = renderToStaticMarkup(<Home cv={completeCV}/>);
    assert.ok(complete.includes(language === 'fr' ? 'Relire et exporter mon CV' : 'Review and export my CV'));
    assert.ok(!complete.includes('href="#cv/presentation"'));
    assert.ok(complete.includes(language === 'fr' ? 'sont facultatifs' : 'are optional'));
  }
  setLanguage('fr');
});

test('empty decisions explain publication ownership, demo boundaries and useful destinations in both languages', () => {
  for (const language of ['fr', 'en'] as const) {
    setLanguage(language);
    const html = renderToStaticMarkup(<Decisions applications={[]} mutate={async () => {}}/>);
    assert.ok(html.includes('href="#suivi"'));
    assert.ok(html.includes('href="#aide"'));
    assert.ok(html.includes(language === 'fr' ? 'Aucune décision partagée pour le moment' : 'No decision has been shared yet'));
    assert.ok(html.includes(language === 'fr' ? 'Aucune candidature n’est envoyée à Parcoursup' : 'No application is submitted to Parcoursup'));
    assert.ok(!html.includes('<p><p>'));
  }
  setLanguage('fr');
});
