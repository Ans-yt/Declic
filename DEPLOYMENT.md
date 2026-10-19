# Deploy Déclic on DeployXA

Déclic is one Node/Express application serving a built React frontend and a SQLite database. Use DeployXA's **Node/backend or Docker deployment**, not its static React/Vite preset. This repository includes a multi-stage `Dockerfile`. No deployment or account changes have been made on your behalf.

## Build and run

For a Node deployment, use Node 24 LTS, install build dependencies with `npm ci --include=dev`, build with `npm run build`, and start with `npm start`. For Docker, select this repository's Dockerfile; it already builds the frontend, server and local OCR assets. Health endpoint: `/api/health`. Default container port: 4173; the server honours the host's `PORT` variable.

Mount a **persistent disk at `/app/data`** (or another writable path and update `DECLIC_DB`). Keep **one app instance / replica** with this SQLite deployment. The database contains uploaded images as well as saved drafts and sessions. Back up the database with SQLite's backup mechanism or stop the app before copying it; copying only a live `.sqlite` file can omit WAL transactions. An ephemeral container filesystem will lose data on redeployment. If your DeployXA plan has no persistent disk, use a VPS/persistent container option before inviting users to save drafts.

### SQLite startup failures on a managed host

`unable to open database file` / `ERR_SQLITE_ERROR` code 14 means the process failed to open storage before it could listen for HTTP requests. Repeating health checks or increasing their timeout does not fix that failure.

The server selects storage in this order: explicit `DECLIC_DB`, then host-injected `DATABASE_URL`, then `data/declic.sqlite` relative to the project root (`/app/data/declic.sqlite` in this Docker image). SQLite `file:` and `sqlite:` URLs are accepted; PostgreSQL/MySQL URLs are rejected. An explicit `DECLIC_DB` overrides the host URL, so remove an obsolete override if using the managed SQLite location. The Dockerfile does not force an override.

Use a **file** inside the actual mounted directory: if the mount is `/app/data`, set `DECLIC_DB=/app/data/declic.sqlite`, not `/app/data`. Do not assume DeployXA's managed SQLite uses that mount; obtain its injected path/mount from the dashboard. Never copy a URL such as `file:/data/app.sqlite` as a literal directory name. The next startup logs the selected file and its configuration source without dumping environment secrets. It fails with a clearer error for a directory target or inaccessible storage; it does not fall back to a disposable database.

The Docker image runs as `node` (UID/GID 1000). Its build-time directory ownership cannot repair a host mount placed over that directory at runtime. If the host mounts a root-owned directory, configure volume ownership/access for UID 1000 or ask the host to do so; the database and its parent must be writable for SQLite WAL/journal files. Existing database, `-wal`, and `-shm` files must also be accessible. Keep existing data and backups; do not delete the database or grant global write access as a workaround.

Once the storage path and permissions are corrected, redeploy the updated source with `APP_ORIGIN` set to the real public **HTTPS** origin. DeployXA's internal HTTP health polling does not change the required public origin.

## Environment and secrets

Use `.env.example` as the reference. Set these in DeployXA's environment/secret settings, not in a committed `.env` or in frontend `VITE_*` variables:

| Variable | Production value |
|---|---|
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `PORT` | DeployXA's assigned port, or `4173` |
| `APP_ORIGIN` | Your exact public HTTPS origin, e.g. `https://declic.example` |
| `DECLIC_DB` | `/app/data/declic.sqlite` on the persistent volume |
| `TRUST_PROXY_HOPS` | Actual number of trusted proxy hops; `1` only if one trusted reverse proxy fronts the app |
| `DECLIC_STAFF_USERNAME` | Your institution administrator username |
| `DECLIC_STAFF_PASSWORD_HASH` | Salted scrypt hash generated below |
| `DECLIC_INSTITUTION_NAME` | Institution display name |

Generate a password hash with `npm run staff:password`. Enter a unique password of at least 12 characters on stdin. Only the salted hash is printed; paste that hash into the secret setting. Shell arguments do not contain the password. The script's stdin prompt is not a password-masking terminal UI, so enter it in a private terminal. No default production password is shipped. Changing the configured username/hash invalidates previous password sessions at the next server start. Login uses eight attempts per 15 minutes per IP and a 12-hour server-side session. Logout revokes the session.

Any generated `data/local-staff-access.txt` is only for this local development installation. It and `.env` are excluded from Git/Docker. Choose your own production credentials rather than uploading that file. A browser's anonymous visitor cookie lasts 180 days; it provides access to that visitor's workspace, not a recoverable cross-device student account.

The public catalogue needs outbound HTTPS to `data.enseignementsup-recherche.gouv.fr`; no API key. Map boundaries and OCR assets are served locally. Geolocation requires HTTPS in production and an explicit browser permission; it remains optional.

## Future institutional identity connection

The backend implements a standard **OpenID Connect Authorization Code flow with PKCE, state and nonce**, using `openid-client`. It does not invent an ENT connection or accept a typed professor ID as proof of identity. An authorised institution/provider must register the app and supply these server-side settings:

- `OIDC_ISSUER`: exact HTTPS issuer identifier.
- `OIDC_CLIENT_ID` and `OIDC_CLIENT_SECRET`: the registered client credentials.
- Registered callback: `APP_ORIGIN/api/auth/oidc/callback`.
- `DECLIC_INTEGRATION_TOKEN`: separate random provisioning secret, at least 32 characters, held only by the institution's integration service.

Server routes (intentionally absent from the demonstration's navigation):

| Route | Behaviour |
|---|---|
| `GET /api/auth/oidc/start` | Begins real registered-provider sign-in; 503 while unconfigured |
| `GET /api/auth/oidc/callback` | Exchanges the code, validates tokens, checks a pre-provisioned identity and creates a staff session |
| `POST /api/integrations/identities` | Authenticated provisioning/revocation with `Authorization: Bearer <integration secret>` |

Provisioning body:

```json
{
  "issuer": "https://identity.school.example",
  "subject": "provider-issued-opaque-subject",
  "staffId": "institution-professor-reference",
  "name": "Display name",
  "institution": "Institution name",
  "active": true
}
```

The issuer must match the configured provider. `subject` comes from that provider, not a user-entered ENT identifier. Only an active provisioned identity can gain staff access; browser-supplied role claims are ignored. Set `active: false` to revoke an identity; existing sessions for that staff ID are removed. This route is disabled without the integration secret. Registering an identity alone never signs it in. Provider discovery, code exchange and token validation need a real registered provider and have not been tested against a live ENT.

This is a working sign-in adapter and permission boundary. Actual school-record import, institutional data tenancy, student account recovery, payroll, recruitment verification and official admissions submission are separate institution-specific projects. Current admissions/replacement records remain labelled fictional and scoped to each visitor's demonstration workspace, even after staff sign-in.

References: [DeployXA documentation](https://deployxa.com/docs), [OpenID client](https://github.com/panva/openid-client), [official catalogue](https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-cartographie_formations_parcoursup/).
