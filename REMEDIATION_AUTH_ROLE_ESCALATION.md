# Inspectra Pro — Authentication & Role-Escalation Remediation Plan

**Status:** Proposed plan only; no application code, deployment configuration, credentials, or data were changed during this review.  
**Assessment basis:** Targeted read-only review of the authentication routes/controller, user routes/controller, JWT and role middleware, seed behavior, deployment configuration, and the existing role-security smoke script.

## 1. Objective and security boundary

Prevent unauthenticated users, inspectors, supervisors, and directors from creating or turning accounts into privileged identities; make account creation and role changes explicit, validated, auditable actions; and ensure every protected request uses the account's current server-side role rather than a client-supplied role.

This plan treats `ADMIN`, `DIRECTOR`, `SUPERVISOR`, and `INSPECTOR` as distinct server-controlled privileges. The browser's selected portal, submitted role, cached profile, URL, or JWT role claim must never independently grant authority.

## 2. Findings to address

| Priority | Current behavior | Consequence | Main code locations |
|---|---|---|---|
| **P0 — Critical** | `POST /api/auth/register` is public and calls a registration handler that accepts `role` from the request body. | An unauthenticated caller can create an account with a privileged role. | `backend/src/routes/authRoutes.js`; `backend/src/controllers/authController.js` (`register`) |
| **P0 — Critical** | Login accepts several hard-coded secondary and universal passwords after the bcrypt check. | A known fallback password can authenticate seeded accounts even when it is not their actual password. | `backend/src/controllers/authController.js` (`login`) |
| **P0 — Critical** | JWT configuration falls back to a repository-known secret; the same value is embedded in Render and Docker configuration. | Forged tokens may be possible wherever the fallback is active; rotating production secrets is required. | `backend/src/config/jwt.js`; `render.yaml`; `docker-compose.yml`; `backend/.env.example` |
| **P1 — High** | `PUT /api/users/:id` is available to any authenticated user. The controller blocks a non-admin `role` field, but accepts a broad spread of other request fields and allows a caller to target another user's record. | Profile mutation is not narrowly scoped; future or overlooked sensitive fields can become writable, and the endpoint's security depends on denylisting specific fields. | `backend/src/routes/userRoutes.js`; `backend/src/controllers/userController.js` (`updateUser`) |
| **P1 — High** | Admin user creation supplies a known default password when none is submitted. | Newly provisioned accounts can have a predictable credential. | `backend/src/controllers/userController.js` (`createUser`) |
| **P1 — High** | Auth middleware accepts JWTs in the query string and returns verification error details. | Tokens in URLs can leak via browser history, access logs, referrers, and monitoring; detailed errors expose unnecessary internals. | `backend/src/middleware/authMiddleware.js` |
| **P1 — High** | Role-update and account-status mutation handlers exist and need a single consistent authorization/audit contract. | Regressions or alternate routes can bypass policy if authorization is enforced only in one controller or route. | `backend/src/routes/userRoutes.js`; `backend/src/controllers/userController.js` |
| **P1 — High** | `seedDatabase()` resets the data store and seeds shared demo credentials; server startup auto-seeds when the user list is empty. | A seed command can destroy data, and an accidentally exposed production demo account can become an easy entry point. | `backend/src/seed/seedData.js`; `backend/src/server.js` |
| **P2 — Moderate** | The existing `scratch/test_role_security.js` is a smoke test for JWT signing and auth middleware; it does not exercise public registration, role changes, profile mass assignment, or route-level denials. It also calls the database seed routine. | The current “role security” pass does not demonstrate resistance to role escalation and may reset the local JSON data file when run. | `scratch/test_role_security.js`; `backend/src/config/db.js` |

**Positive control already present:** `authenticateJWT` re-loads the user record and uses the stored role for `req.user`, rather than trusting the token's role claim. Preserve and regression-test this property.

## 3. Target policy decisions

Adopt these defaults unless product requirements explicitly call for a different, reviewed flow:

1. **No public account registration.** Accounts are provisioned by an authorized administrator or through an invitation workflow. Do not leave an unauthenticated registration endpoint that accepts a role.
2. **Least privilege by default.** Any invitation-based activation creates an `INSPECTOR`-level pending account only. Privileged roles are assigned by an existing administrator through a separate, audited operation.
3. **Server-side authority.** The database is authoritative for user status and role. Ignore role, status, permission, and identity fields supplied by the client except in validated admin-only operations.
4. **Narrow writable fields.** Profile edits accept only an explicit allowlist and only for the authenticated user. Administrative account/role changes use dedicated endpoints and schemas.
5. **No shared production credentials.** Remove generic/demo password bypasses and fixed default passwords. Keep demo accounts only in an isolated, explicitly enabled demo deployment.
6. **Fail closed in production.** Missing or weak JWT configuration prevents production startup; there is no code default secret.

## 4. Remediation work plan

### Phase 0 — Containment and preparation

- Confirm which deployments are public and whether any are intended as demo-only. Do not assume a `NODE_ENV` value alone makes a publicly reachable service safe for demo credentials.
- Disable public registration at the route boundary immediately in the production rollout. If account registration is not a requirement, remove the route; otherwise make it return `404`/`410` until the invitation workflow is implemented.
- Prepare a unique high-entropy production JWT signing secret through the deployment secret manager. Do not store it in Git, `.env.example`, Docker image layers, frontend assets, or logs.
- Plan the secret rotation as a session invalidation event: existing JWTs signed by the known key will stop working. Communicate the re-login impact to users and coordinate backend, web, and mobile deployment.
- Inventory current administrator accounts through a controlled, read-only operational process. Confirm there is at least one reachable trusted administrator before removing any bootstrap path.
- **Do not run `seedDatabase()` against production.** The current seed routine calls `db.reset()` before populating demo records. Any cleanup or migration of existing accounts/data must be a separate reviewed operation with a backup and a recovery procedure.

**Exit criteria:** Public registration is unavailable in production; production secret and administrator recovery path are ready; a verified backup/rollback plan exists; demo seeding is disabled for production operation.

### Phase 1 — Close direct privilege-escalation paths

1. **Retire public `/auth/register`.**
   - Remove the route or return a non-success response without writing a user record.
   - If registration is required, replace it with invitation acceptance: one-time, expiring, single-use token; invitation binds the email and allowed initial role; activation cannot change role/status/ID; do not accept arbitrary `role` or `password_hash` fields.
   - Keep the privileged role assignment separate from account activation. An invitation must not be able to grant `ADMIN`.

2. **Constrain administrator user creation.**
   - Keep `POST /api/users` behind both authentication and an explicit admin authorization check.
   - Require an explicit valid role or default to `INSPECTOR`; reject invalid or unsupported roles rather than silently accepting them.
   - Remove the known fallback password. Prefer a one-time activation link or random, expiring setup token. If a password must be set at creation, require a policy-compliant value and never return or log it.
   - Validate/canonicalize email and username, reject duplicates case-insensitively, and allowlist accepted fields. Ignore or reject `status`, `password_hash`, IDs, and internal permission properties from the request.

3. **Make role changes a dedicated, policy-checked operation.**
   - Retain a dedicated `PUT /api/users/:id/role` (or equivalent) with `authenticateJWT` and `authorizeRoles(ADMIN)` at the route boundary; keep controller-side validation as defense in depth.
   - Allow only the enumerated role values. Reject missing, malformed, array/object, or unknown role inputs.
   - Prevent self-demotion or removal of the last active administrator unless an explicit recovery-safe administrative workflow is implemented.
   - Revoke the target's active sessions/tokens when its role changes; at minimum, use server-side token version/revocation or short-lived access tokens backed by a current-user check. Do not rely on a stale role embedded in an old token.

4. **Replace mass assignment in `updateUser`.**
   - Change profile updates to an allowlist of benign self-service fields (for example, display name, phone, avatar) and force the target ID to `req.user.id` for ordinary users.
   - Reject attempts to set `role`, `status`, `password_hash`, `is_admin`, permissions, account IDs, or any unrecognized field. Do not implement security as a denylist of known sensitive fields.
   - Route password changes through a separate endpoint requiring current-password verification (or a verified reset/activation token), password policy checks, and revocation of prior sessions.
   - For administrators editing another user's profile, use a distinct admin operation with its own schema and audit event; do not make the ordinary self-profile endpoint double as an admin API.

**Exit criteria:** No anonymous request can create a user; no non-admin can alter a role/status or target another account through profile update; all privileged mutations have route-level authorization and controller validation; no generic password is assigned.

### Phase 2 — Remove weak authentication and harden sessions

- Remove the secondary/universal password fallback logic from login. Authentication succeeds only when the supplied password verifies against the stored password hash and the account is active.
- Limit demo credentials to a separate demo environment/data set. Do not seed demo accounts in production. Require an explicit non-production demo flag and fail startup if the demo flag is enabled together with production mode.
- Remove the hard-coded JWT secret fallback. On production startup, validate secret presence and minimum entropy/length, and terminate startup with a clear non-secret error if invalid. Update Docker/Render deployment to reference managed secrets, not literal values. Use a placeholder in `.env.example` and document local secret generation.
- Remove query-string JWT authentication. Accept credentials only in the `Authorization: Bearer` header or a deliberately designed secure cookie flow. Return a generic authentication error without echoing verifier exception details.
- Use a shorter access-token lifetime suitable for the application and a deliberate refresh/session-revocation design. Enforce current account status on each request (already present); add a token-version/session check if immediate revocation is required.
- Add login and invitation/reset rate limits, generic credential failure responses, and monitoring for repeated failures. Avoid account-existence disclosure in login errors.
- Review account recovery: the current “forgot password” interface is client-side messaging only. Until a server-side verified reset flow exists, present it as unavailable rather than implying that a reset email was sent.

**Exit criteria:** No login path accepts a known fallback credential; production refuses to start with an absent/default signing key; old tokens are invalidated during rotation; query-string credentials are rejected; brute-force and recovery paths have explicit controls.

### Phase 3 — Auditability and deployment hygiene

- Emit structured security audit events for invitation creation/acceptance, user creation, role change, activation/suspension, password reset/change, failed login thresholds, and administrator actions. Record actor ID/role, target ID, timestamp, outcome, and request/correlation ID; never record passwords, raw tokens, or reset links.
- Make audit writes fail safely and alert on failure for security-critical mutations. Current file-backed JSON persistence is not a tamper-resistant audit store; treat it as a prototype limitation and move production security/audit records to durable storage with access controls and backups.
- Update production deployment settings to a strict CORS origin list and managed secrets. Keep local Docker development values in an ignored local override; do not commit working shared secrets.
- Ensure API logs and reverse-proxy logs redact `Authorization` and sensitive request bodies. Do not place tokens in URLs.
- Review deployment/build outputs so no backend secret or development account credentials enter the frontend bundle.

**Exit criteria:** Security events are attributable and queryable; no secret appears in repository/deployment literals or logs; production CORS and credential transport are explicitly configured.

### Phase 4 — Automated verification and release gate

Build an automated API-level auth suite using an isolated test database and test-only signing key. Do not reuse the production JSON file, and do not invoke the current destructive seed routine against a shared environment. Replace or clearly relabel the existing smoke script so it cannot imply full RBAC coverage.

Required tests:

| Test case | Expected result |
|---|---|
| Anonymous `POST /api/auth/register` with `role: ADMIN` | Denied/not found; no user record created |
| Invitation acceptance with tampered role, status, user ID, or password hash | Rejected; no privilege change |
| Inspector/supervisor/director attempts `POST /api/users` | `403`; no account created |
| Inspector attempts role assignment or status mutation | `403`; target unchanged |
| Non-admin `PUT /api/users/:id` includes `role`, `status`, `password_hash`, or unknown fields | `400`/`403`; nothing changed |
| Non-admin targets another user's profile endpoint | Cannot modify the other user's record |
| Admin role assignment with invalid role value | `400`; no change |
| Admin legitimate role assignment | Success; exact target role changes; audit event recorded; target sessions revoked/refreshed as designed |
| Self-demotion/last-admin removal | Rejected unless recovery-safe workflow is used |
| Login using each legacy fallback password | `401` unless it is the user's actual valid password in an explicitly isolated demo environment |
| Login for inactive/suspended account | Denied; no token issued |
| Request with role claim saying ADMIN but database user is INSPECTOR | Effective role remains `INSPECTOR`; admin route returns `403` |
| Tampered, expired, malformed, or old-secret JWT | `401`; no protected action occurs |
| JWT supplied as query parameter | `401`; no protected action occurs |
| Login burst / repeated failures | Rate-limited; response does not disclose account existence |
| Account creation/update error | No partial user/inspector records; transactional behavior or compensating rollback is verified |

Also run a complete route authorization matrix for all roles across every mutating route, not only `/api/users`. Audit exceptions where role policy intentionally differs.

**Release gate:** all tests above pass; backend and frontend production builds pass; secret scan confirms no live/default signing secret or shared production credential; deployment smoke test verifies login, `/auth/me`, role denial, admin provisioning, and immediate suspension/revocation behavior.

## 5. Suggested implementation order

1. Contain public registration and production demo credentials.
2. Add tests that reproduce each escalation path before fixing it.
3. Close public registration; harden user creation, profile updates, and role/status mutations.
4. Remove password bypasses and predictable default passwords.
5. Require managed JWT secret, rotate it, and remove query-token support.
6. Add audit events, rate limits, deployment checks, and complete the role/route matrix.
7. Deploy in a maintenance window; verify production denials and administrator recovery; monitor auth failures and account/role changes.

Do not ship phases 3–6 while leaving the public registration or weak password paths open. Where a short-term emergency patch is needed, prefer denying the risky operation over preserving an insecure workflow.

## 6. Rollout, communication, and recovery

- **Before rollout:** back up the current user and operational data; identify verified admins; prepare new secret and test environment; warn users that signing-key rotation requires sign-in again.
- **Deployment:** first deploy code that removes the public registration and fallback behavior, then configure and rotate the signing secret as part of the same controlled release. Confirm all app clients send tokens only in the supported header/cookie format.
- **Verification:** run the release gate against production with low-risk test accounts; confirm non-admin denial, admin-only account operations, audit records, and recovery contact path.
- **Rollback principle:** do not restore the vulnerable route or known key as a rollback. If the secure release fails, disable account/role mutation endpoints or place the API in maintenance mode while correcting the release. Maintain a documented, offline break-glass administrator recovery procedure.

## 7. Repo-specific files to touch during implementation

- `backend/src/routes/authRoutes.js` — retire or replace public registration.
- `backend/src/controllers/authController.js` — remove role-trusting registration and legacy password bypass; normalize login failures.
- `backend/src/routes/userRoutes.js` and `backend/src/controllers/userController.js` — constrain account creation, role/status changes, and profile mutation.
- `backend/src/config/jwt.js` and `backend/src/middleware/authMiddleware.js` — require configured secret, remove query tokens, normalize errors/revocation checks.
- `backend/src/middleware/roleMiddleware.js` — retain as centralized route authorization; add tests for every policy boundary.
- `backend/src/seed/seedData.js` and `backend/src/server.js` — isolate demo seeding and prevent production auto-seeding.
- `backend/src/middleware/auditMiddleware.js` — add security-specific audit events and safe redaction.
- `render.yaml`, `docker-compose.yml`, `backend/.env.example` — remove literal signing secrets and align environment setup.
- `scratch/test_role_security.js` — replace/augment with automated, isolated integration tests; do not run it against shared or production data.

## 8. Definition of done

- No unauthenticated route creates or activates accounts.
- Only a currently active administrator can perform explicitly authorized role assignment; role values are strictly validated and every change is auditable.
- Ordinary profile updates are self-scoped and allowlist-based; password changes use a verified flow.
- No generic/demo/fallback password authenticates a production account.
- No default JWT secret exists in application or deployment code; secret rotation invalidates prior tokens and is operationally documented.
- User status/role changes take effect for active sessions according to the documented revocation design.
- The auth/RBAC integration suite proves both allowed and denied behavior for all four roles without touching shared data.
- Production deploy passes the release gate and has a secure administrator recovery process.
