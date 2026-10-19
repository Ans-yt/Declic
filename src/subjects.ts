export const subjects = [
  { id: 'science', fr: 'Sciences', en: 'Sciences', query: 'sciences', detail: ['Observer, expérimenter, comprendre ce qui nous entoure.', 'Observe, experiment and understand the world around us.'] },
  { id: 'art', fr: 'Arts & design', en: 'Arts & design', query: 'arts', detail: ['Donner une forme aux idées, inventer d’autres regards.', 'Give ideas a shape and discover new ways of seeing.'] },
  { id: 'architecture', fr: 'Architecture', en: 'Architecture', query: 'architecture', detail: ['Imaginer les lieux dans lesquels nous vivrons demain.', 'Imagine the places we will live in tomorrow.'] },
  { id: 'environment', fr: 'Environnement & vivant', en: 'Environment & life', query: 'environnement', detail: ['Explorer le vivant et penser notre place dans ses équilibres.', 'Explore living systems and our place within them.'] },
  { id: 'health', fr: 'Santé', en: 'Health', query: 'santé', detail: ['Comprendre le corps, prendre soin, faire avancer la recherche.', 'Understand the body, care for others and advance research.'] },
  { id: 'technology', fr: 'Informatique & ingénierie', en: 'Computing & engineering', query: 'informatique', detail: ['Construire des outils, des systèmes et de nouvelles possibilités.', 'Build tools, systems and new possibilities.'] },
  { id: 'law', fr: 'Droit & sciences humaines', en: 'Law & humanities', query: 'droit', detail: ['Questionner nos sociétés, comprendre les règles et leurs histoires.', 'Question society and understand its rules and histories.'] },
  { id: 'economics', fr: 'Économie & commerce', en: 'Economics & business', query: 'économie', detail: ['Comprendre les échanges et les idées qui font bouger le monde.', 'Understand the exchanges and ideas that move the world.'] },
] as const;
export const subjectImage = (id: string) => `/assets/subjects/${id}.webp`;
export const subjectRoute = (id: string) => `#formations/${id}`;
