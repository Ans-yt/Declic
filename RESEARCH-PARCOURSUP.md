# Parcoursup, student demands, and a realistic hackathon project

Research checked on 16 October 2026. This is a research and product brief, not a claim that students share one political position. Current union demands, survey responses, official descriptions, and proposed product features are distinguished below.

## 1. What the evidence establishes

The 2025 CSA barometer surveyed 1,005 new baccalaureate holders registered on Parcoursup, admitted or otherwise, online from 28 August to 4 September 2025. Among respondents, 84% described the procedure as stressful, 53% as transparent, and 34% as fair and equitable. These measure perceptions, not a statistical finding that a given percentage of decisions was discriminatory. I did not locate a published 2026 edition in the searches conducted. [CSA report, methodology p. 2 and results p. 30](https://csa.eu/wp-content/uploads/2025/10/2500648-Baro-Parcoursup-2025-Resultats_1609_vSITE-CSA.pdf)

The current national consultation remains open until 23 October 2026, with national restitution announced for late October. Its final results therefore cannot yet establish what all French high school students want. The ministry identifies five current work areas: replacement coverage, buildings, daily schedules, orientation, and student participation. [Ministry, updated 9 October 2026](https://www.education.gouv.fr/construire-des-solutions-avec-les-lyceens-506143?lang=en)

## 2. What Parcoursup actually does

Institutions' commissions evaluate applications and produce rankings. The national platform manages applications and offers, applying relevant legal priorities. Selective programs can refuse applicants; oversubscribed programs described as non-selective also rank candidates within available capacity. An excellent student can remain waiting because other ranked candidates have not yet released places. That alone does not establish a mistake. [Official explanation](https://www.parcoursup.gouv.fr/candidater-sur-parcoursup/comment-les-formations-examinent-les-candidatures-1357)

The platform already provides criteria, reports, statistics, comparison tools, waiting-list information, and routes to request explanations. Improving them requires distinguishing existing public information from missing personalized reasons. [Waiting-list and information FAQ](https://www.parcoursup.gouv.fr/faq/thematiques/fonctionnement-de-parcoursup/recevoir-les-reponses-et-propositions-d-admission)

Transparency has several layers: the national offer mechanism; each institution's actual evaluation rules; the evidence and judgment applied to one applicant; and an understandable explanation of available next steps. Publishing a national algorithm does not resolve every layer. An official technical account documents publication of the national algorithms; it is historical evidence of publication, not verification of the current deployed code. [Ministry technical explanation, 2020](https://www.enseignementsup-recherche.gouv.fr/sites/default/files/content_migration/document/Presentation_Algorithmes_Parcoursup_2020_1287480.pdf)

## 3. First list: documented demands and needs

### Explicit current movement demands

The joint ten-measure platform calls for:

1. Renovated, clean buildings adapted to heat and cold.
2. More teaching, health, guidance and disability-support staff.
3. Revised school and university rhythms, including adequate lunch breaks.
4. Ending selection through Parcoursup and Mon Master, retaining centralized applications, and adding 250,000 higher education places.
5. Stronger student representation.
6. Higher and more widely available grants and housing assistance.
7. Effective access to the one-euro student meal.
8. Ending differentiated international-student fees and the CVEC.
9. Affordable, renovated and expanded CROUS housing.
10. Protection of protest and organizing rights.

These are demands, not enacted measures, verified costs, or a survey of all students. The platform also explicitly prefers additional permanent teaching posts over contract jobs: a casual staffing marketplace would not satisfy that demand. [Full platform](https://union-etudiante.fr/10mesures/)

The USL additionally highlights overcrowding, unreplaced teachers, degraded buildings and orientation stress in its own public presentation. [USL](https://unionlyceenne.fr/)

### Admissions needs supported by other evidence

11. Understand criteria before applying and what actually affected an outcome.
12. Obtain usable guidance without depending on family knowledge or private coaching.
13. Understand waiting, deadlines, and realistic alternatives.
14. Reduce territorial and social disadvantages.
15. Obtain accessible explanations, corrections and recourse when something is wrong.

These synthesize the survey and institutional concerns; they are not quotations from a single student manifesto. The February 2026 parliamentary mission discusses guidance and the contested use of the school of origin. The April 2026 ethics committee report examines effectiveness, readability, equity and process security. [Parliamentary report](https://www.assemblee-nationale.fr/dyn/17/documents/parsup/l17n771491814_document.pdf), [Ethics committee report](https://www.enseignementsup-recherche.gouv.fr/fr/comite-ethique-et-scientifique-de-parcoursup-et-mon-master-8e-rapport-annuel-au-parlement-101333)

The Défenseur des droits has specifically recommended greater transparency of local evaluation and anonymization of school and residence information because of discrimination risks. It also documents obstacles to challenging admissions decisions. These concerns cannot reasonably be reduced to students disliking academic standards. [Recommendations](https://www.defenseurdesdroits.fr/sites/default/files/2023-12/fiches-reformes_013.pdf), [2025 education update](https://www.defenseurdesdroits.fr/rentree-2025-la-defenseure-des-droits-reitere-ses-recommandations-pour-la-reussite-de-tous-les-917)

## 4. Second list: what the project could deliver

These are design proposals, not features shown to be universally requested or proven effective.

| Need | Working feature | Honest boundary |
|---|---|---|
| Understand selection | Criteria cards with the source, session, importance and examples | Public importance labels may not reveal a precise scoring formula |
| Understand one's outcome | Decision receipt recording criteria, evidence, reviewer and reason | Authentic individualized reasons require institution participation |
| Understand waiting | Explain queue position, last called rank, capacity and updates separately | Historical cutoffs do not guarantee this year's outcome |
| Avoid procedural mistakes | Checklist, deadline reminders and explicit next action | Official deadlines and statuses remain authoritative |
| Discover realistic choices | Compare interests, prerequisites, location and affordability | Suggestions should expand options, not decide ambition |
| Correct mistakes | Record correction requests, evidence, owner and status | The app cannot reverse an institutional decision itself |
| Challenge unfair treatment | Explain official routes and prepare a factual request | Do not invent appeal deadlines or promise a remedy |
| Fairer assessment | Demonstrate masked review and audit rule consistency | Masking alone does not establish fairness; lawful priorities remain relevant |
| Access guidance | Book a qualified advisor or route to public guidance services | Actual availability depends on partners |
| Accessible service | Plain French, keyboard access, mobile layout, clear glossary | Test with actual users rather than claiming accessibility from appearance |
| Lost lesson hours | Separate verified replacement scheduling module | Staffing, budgets and authorization remain necessary |
| More university places | Display capacity and unmet demand for planning | Software cannot create teaching posts or classrooms |
| Better buildings and shorter days | Optional issue reporting or scheduling analysis later | These are separate operational projects |
| Housing and living costs | Optional budget and official-aid links | The app cannot enact grants or regulate rent |

Avoid a student 'character score'. Assess specific relevant evidence through a published rubric; do not infer laziness, morality, or ability from low grades or subjective personality judgments. Academic readiness can matter while unequal preparation and support still require attention.

## 5. Recommended hackathon scope

Working concept: **Cap Clair**, an independent companion and demonstrator for understandable admissions.

Problem statement: students at our school struggle to understand how their application is evaluated, what waiting means, and what to do next.

Target users: première and terminale students first; students changing courses second. Start with one lycée and a small set of relevant local programs, rather than national coverage.

Build three complete flows:

1. **Understand a program.** Import a small official public-data selection, show source and session, summarize criteria, compare prerequisites and practical costs. Mark missing data visibly.
2. **Understand waiting.** Let a student manually enter a few status fields. Explain their meaning and suggest next steps. Use an explicitly synthetic queue to show how releasing a place moves another applicant forward. Do not imply that the app reads live Parcoursup accounts.
3. **Understand a decision.** On a separately labelled simulation screen, an admissions reviewer evaluates a fictitious application using published demonstration rules. Generate a traceable receipt with evidence and a correction route. A rule-based engine can verify the output; an AI can simplify wording without inventing reasons.

For a 48-hour event, prioritize the first two flows and a minimal third. Leave staffing as a second milestone unless the team has a school partner and enough capacity.

Official open data contains aggregate program-level applications and admissions, including capacity, applicant counts and historical last-called ranks. It does not supply applicants' private files, individualized reasons, or a live queue. Inspect the session field and data dictionary; snippets and portal descriptions can be inconsistent. [Official dataset](https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-parcoursup/)

Do not claim novelty from a map, comparator, simulator or personalized suggestions alone. Parcoursup already offers several of these, and Onisep's MonProjetSup provides personalized exploration through Avenir(s). The differentiator should be the connection between sourced criteria, understandable status, evidence, and next action. [Parcoursup overview](https://www.parcoursup.gouv.fr/decouvrir-parcoursup/parcoursup-c-est-quoi-1061), [Onisep MonProjetSup, March 2026](https://www.onisep.fr/orientation/monprojetsup-bien-preparer-son-orientation-post-bac)

## 6. The teacher replacement idea, corrected

Replacement teachers have not generally been abolished. The ministry describes TZRs and contract teachers, with short absences primarily organized by establishments and longer ones by academic services. It also describes pedagogical work between assignments. I found no reliable support for the proposed national history that these posts were eliminated because teachers were paid to do nothing. [Current replacement arrangements](https://www.education.gouv.fr/l-organisation-du-remplacement-des-enseignants-11321), [TZR role](https://www.education.gouv.fr/enseignant-titulaire-sur-zone-de-remplacement-tzr-dans-le-second-degre-505148)

The need is real: a report summarized by the Défenseur des droits found that 9% of compulsory teaching hours were not delivered in public collèges in 2023–24. This is a collège figure, not a measured lycée rate, and does not mean all those hours are recoverable by better scheduling. [January 2026 summary](https://www.defenseurdesdroits.fr/temps-denseignement-perdu-par-les-eleves-au-college-sollicitee-par-la-defenseure-des-droits-la-cour)

A viable separate prototype would match **already authorized** teachers to scheduled needs using subject, level, availability, travel time, notice preference, workload and continuity. An administrator confirms the assignment; the teacher receives the lesson handover; completed hours require confirmation before payroll export. Handle cancellations and retain a fallback when no qualified person is available. Advance notice can be guaranteed for planned absences only.

Adults outside the existing pool need an authorized recruitment and onboarding route. The ministry describes degree requirements and public-law teaching contracts; a general degree and good intentions do not automatically authorize teaching. Pay must be handled through the responsible employer and actual contract, not presented as a universal per-hour volunteer reward. [Contract teacher recruitment](https://www.devenirenseignant.gouv.fr/le-recrutement-contractuel-1118)

For a demo, keep fictional profiles and a verified-eligibility flag; do not gather real criminal-record documents. Criminal-record processing has specific limits and authorized checks. [CNIL explanation](https://www.cnil.fr/fr/cnil-direct/question/extrait-de-casier-judiciaire-lemployeur-peut-il-le-demander-et-le-conserver)

## 7. Validation that fits the hackathon brief

Interview approximately six local students, one guidance professional and one admissions reviewer if available. Ask students to describe a real point of confusion before showing the solution. Include different bac pathways and levels of family support where feasible. Record anonymized observations rather than claiming national representativeness.

Use three comprehension tasks: explain what a criterion means; explain why waiting is not refusal; identify the next action and its deadline. Measure correct answers and completion time before and after the prototype. Report the actual small sample and results, including failures. A school administrator can separately test whether a simulated replacement match is feasible.

Useful demo claims: 'five of six testers identified the next action' if observed; 'the simulation explains its rule and inputs' if verified. Unsupported claims: 'we eliminated discrimination', 'we reduced national stress', 'we can predict admissions', or 'we solved teacher shortages'.

## 8. Suggested pitch

At our lycée, students describe a gap between the effort they put into school and their ability to understand admissions. Cap Clair turns public criteria and application statuses into explanations and next steps. Its demonstration admissions workflow makes each simulated decision traceable and correctable. We start with one school's students and measure whether they can understand and act on their options more confidently.

The replacement module belongs to the wider long-term vision of fair learning opportunities before fair admissions. It should be pitched as a separately testable service with its own school partners, staffing approvals and budget.
