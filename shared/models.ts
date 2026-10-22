import { z } from 'zod';

const short = z.string().max(300);
const text = z.string().max(6000);
const required = short.trim().min(1, 'Ce champ est nécessaire.');
export const profileSchema = z.object({ firstname: short, lastname: short, school: short, path: short, interests: text, email: z.union([z.literal(''), z.email()]), city: short });
export const entrySchema = z.object({ id: z.string().uuid(), title: short, organization: short, period: short, detail: text });
export const awardSchema = z.object({ id: z.uuid(), title: required, organization: short, date: short, detail: text, attachmentId: z.uuid().nullable() });
export const cvSchema = z.object({ title: short, about: text, skills: text, languages: text, education: z.array(entrySchema).max(30), experience: z.array(entrySchema).max(30), engagement: z.array(entrySchema).max(30), awards: z.array(awardSchema).max(20).default([]) });
export const profileDraftSchema = profileSchema.extend({ email: short });
export const cvDraftSchema = cvSchema.extend({ awards: z.array(awardSchema.extend({ title: short })).max(20).default([]) });
export const applicationSchema = z.object({ reference: required, formation: required, summary: text });
export const reviewSchema = z.object({ criterion: required, evidence: required, explanation: text.trim().min(1), outcome: z.enum(['admitted', 'waiting', 'declined']) });
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, 'Date invalide.');
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const slot = { date, start: time, end: time };
export const needSchema = z.object({ subject: required, school: required, city: required, ...slot, notes: text }).refine(v => v.end > v.start, { message: 'La fin doit suivre le début.', path: ['end'] });
export const candidateSchema = z.object({ name: required, subject: required, city: required, qualification: required, experience: text, ...slot }).refine(v => v.end > v.start, { message: 'La fin doit suivre le début.', path: ['end'] });
export const hoursSchema = z.object({ hours: z.number().positive().max(24) });
export type Profile = z.infer<typeof profileSchema>;
export type CV = z.infer<typeof cvSchema>;
export type CVEntry = z.infer<typeof entrySchema>;
export type Award = z.infer<typeof awardSchema>;
export type Section = 'education' | 'experience' | 'engagement';
export type Review = z.infer<typeof reviewSchema>;
export type Application = z.infer<typeof applicationSchema> & { id: string; status: 'pending' | 'reviewed' | 'published'; review: Review | null; createdAt: string; updatedAt: string; questions: { id: string; text: string; answer: string; createdAt: string }[] };
export type Candidate = z.infer<typeof candidateSchema> & { id: string; verified: boolean };
export type Need = z.infer<typeof needSchema> & { id: string; status: 'open' | 'confirmed' | 'completed' | 'cancelled'; candidateId: string | null; hours: number | null; createdAt: string };
const programmeId = z.string().regex(/^\d{4}:\d+$/);
const personalDate = z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v)]);
export const plannerSchema = z.object({
  notes: z.array(z.object({ programmeId, note: z.string().max(3000), question: z.string().max(1000) })).max(100),
  tasks: z.array(z.object({ id: z.uuid(), programmeId, title: z.string().trim().min(1).max(300), dueDate: personalDate, done: z.boolean() })).max(200)
}).refine(v => new Set(v.notes.map(n => n.programmeId)).size === v.notes.length && new Set(v.tasks.map(n => n.id)).size === v.tasks.length, 'Éléments en double.');
export type Planner = z.infer<typeof plannerSchema>;
export const blankPlanner: Planner = { notes: [], tasks: [] };
export const savedSchema = z.array(programmeId).max(100).refine(ids => new Set(ids).size === ids.length, 'Formations en double.');
export const backupSchema = z.object({
  format: z.literal('declic-personal-backup'), version: z.literal(1), profile: profileSchema,
  cv: cvSchema.refine(cv => cv.awards.every(a => a.attachmentId === null), 'Les images ne font pas partie de cette sauvegarde.'),
  saved: savedSchema, planner: plannerSchema
}).strict();
export type Workspace = { profile: Profile; cv: CV; saved: string[]; applications: Application[]; needs: Need[]; candidates: Candidate[]; planner: Planner; draftKey: string; demoApplicationId: string | null };
export const blankProfile: Profile = { firstname: '', lastname: '', school: '', path: '', interests: '', email: '', city: '' };
export const blankCV: CV = { title: '', about: '', skills: '', languages: '', education: [], experience: [], engagement: [], awards: [] };
export const outcomeLabels: Record<Review['outcome'], string> = { admitted: 'Proposition d’admission', waiting: 'En attente', declined: 'Non retenue' };
export const needLabels: Record<Need['status'], string> = { open: 'À pourvoir', confirmed: 'Confirmé', completed: 'Heures validées', cancelled: 'Annulé' };
