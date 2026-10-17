export type StaffIdentity = { id: string; name: string; institution: string; source: 'password' | 'oidc' };
export type AuthState = { staff: StaffIdentity | null; passwordEnabled: boolean };
