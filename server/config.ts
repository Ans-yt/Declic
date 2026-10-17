import { z } from 'zod';

export type AppConfig = { production: boolean; origin: string | null; trustProxy: number; staffUsername: string; staffPasswordHash: string; institution: string; integrationToken: string; oidcIssuer: string; oidcClientId: string; oidcClientSecret: string };
export function readConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const production = env.NODE_ENV === 'production';
  const origin = env.APP_ORIGIN ? new URL(env.APP_ORIGIN).origin : null;
  if (production && (!origin || !origin.startsWith('https://'))) throw new Error('APP_ORIGIN must be your public HTTPS origin in production.');
  const staffPasswordHash = env.DECLIC_STAFF_PASSWORD_HASH || '';
  if (staffPasswordHash && !/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(staffPasswordHash)) throw new Error('Invalid DECLIC_STAFF_PASSWORD_HASH. Use npm run staff:password.');
  if (env.DECLIC_INTEGRATION_TOKEN && env.DECLIC_INTEGRATION_TOKEN.length < 32) throw new Error('DECLIC_INTEGRATION_TOKEN must contain at least 32 characters.');
  if (env.OIDC_ISSUER && !env.OIDC_ISSUER.startsWith('https://')) throw new Error('OIDC_ISSUER must use HTTPS.');
  return { production, origin, trustProxy: z.coerce.number().int().min(0).max(5).parse(env.TRUST_PROXY_HOPS || '0'), staffUsername: env.DECLIC_STAFF_USERNAME || '', staffPasswordHash, institution: env.DECLIC_INSTITUTION_NAME || 'Déclic', integrationToken: env.DECLIC_INTEGRATION_TOKEN || '', oidcIssuer: env.OIDC_ISSUER || '', oidcClientId: env.OIDC_CLIENT_ID || '', oidcClientSecret: env.OIDC_CLIENT_SECRET || '' };
}
