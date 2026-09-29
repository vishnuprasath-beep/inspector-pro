# Engineering Briefing Script: Authentication & Role-Escalation Remediation

**Audience:** Backend, frontend, platform/DevOps, QA, product/security stakeholders  
**Estimated delivery:** 8–10 minutes, plus discussion  
**Format:** Speaker notes for an 8-slide briefing; this is a script, not a slide deck.  
**Status:** Proposed remediation. The review was read-only; no application changes were made and no successful exploit has been demonstrated.

## Before presenting

The companion remediation plan is [REMEDIATION_AUTH_ROLE_ESCALATION.md](REMEDIATION_AUTH_ROLE_ESCALATION.md). Keep it open for the detailed endpoint-level checklist and test matrix.

---

## Slide 1 — Why we are here (about 45 seconds)

**Say:**

“Today I’m proposing a focused remediation for authentication and role escalation in Inspectra Pro. This is based on a targeted code review—not a penetration test—and it does not mean we have evidence that someone exploited the application. It does mean the code contains paths that could allow privilege misuse if the service is reachable in its current configuration.

“Our goal is straightforward: only trusted, authorized workflows can create accounts or assign roles; everyday profile updates cannot change security-sensitive fields; and production authentication depends on unique secrets and real credentials. We’ll cover the confirmed code paths, the order to close them, and what must pass before we call the work done.”

**Transition:** “First, let’s agree on the trust boundary.”

## Slide 2 — The trust boundary: roles are server-owned (about 50 seconds)

**Say:**

“We have four distinct roles: Admin, Director, Supervisor, and Inspector. The role selected on the login screen is a navigation choice, not proof of authority. The same is true of a cached frontend profile, a URL, or a role value in a request body.

“The backend should authenticate the identity, load the current account, check its active status, and authorize each operation against the role stored by the server. There is one good foundation already in place: the JWT middleware reloads the user record and populates the request role from that record rather than trusting the token’s role claim. We should preserve that control and add regression tests around it.”

**Emphasize:** “A client can request an action; only the server can grant it.”

## Slide 3 — What the review found (about 90 seconds)

**Say:**

“There are three critical issues to close first.

“First, `POST /api/auth/register` is public, and the registration controller accepts a role from the request body. That creates a direct route from an unauthenticated request to a potentially privileged account.

“Second, login has secondary and universal password checks after bcrypt verification. That means a known fallback can authenticate a seeded account even when it is not the account’s actual password.

“Third, JWT configuration has a built-in fallback secret, and the deployment files contain the same signing value. Anyone who knows that value can potentially forge tokens in an environment where the fallback is active. We need to remove the default and rotate the production key.

“There are also important high-priority weaknesses. The general user-update endpoint is available to any authenticated user, accepts a broad set of fields, and allows a caller to name another user ID. The controller has a role-field check, but the safer design is an allowlist and self-scoped profile update—not a growing list of forbidden fields. Admin-created users can also receive a known default password. Query-string JWTs are accepted, which can leak through URLs and logs. Finally, seed data contains shared demo credentials, and the seed routine resets the store, so it must never be run against production data.”

**Clarify:** “These are code-review findings and risk statements, not a claim that a production exploit occurred.”

## Slide 4 — The proposed policy (about 60 seconds)

**Say:**

“The policy proposal is least privilege and explicit authority.

“Unless product requirements say otherwise, there should be no public account registration. If self-service onboarding is required, use an invitation with a one-time, expiring token bound to the invited email and a low-privilege initial role. Elevated roles are assigned separately by an existing administrator.

“Profile edits should be limited to an allowlist of benign fields and scoped to the authenticated person. Password changes get a separate verified flow. Role, account status, password hash, identity, and permission fields are never writable through a generic profile endpoint.

“Production should have no shared demo credentials and no fallback JWT key. If a production secret is missing or misconfigured, the service should fail closed.”

**Decision to surface:** “Does the product need public registration at all? If yes, we should approve the invitation workflow as the supported alternative before implementation.”

## Slide 5 — Remediation sequence (about 90 seconds)

**Say:**

“We should do this in a safety-first order.

“Phase zero is containment and preparation: establish which deployments are public versus demo-only, disable public registration in production, prepare a managed signing secret, verify that at least one trusted administrator can recover access, and take a backup. Do not run the existing seed routine against production—it calls a reset before inserting demo records.

“Phase one closes direct escalation. Retire public registration or replace it with the invitation flow. Harden admin account creation so it validates fields and never invents a known password. Keep role changes in a dedicated Admin-only endpoint with strict role validation, audit records, safeguards against removing the last administrator, and session revocation. Replace generic user updates with self-scoped, allowlisted profile updates.

“Phase two removes fallback passwords, requires a configured JWT secret, removes query-string tokens, and defines how token expiry and revocation work. Rotating the signing key will invalidate current sessions, so the web and mobile clients need a coordinated re-login plan.

“Phase three adds reliable security audit events, secret/log hygiene, and production configuration checks. Phase four makes the whole policy executable as automated tests and a deployment gate.”

**Transition:** “The most important proof is not that the happy path still works; it’s that forbidden paths stay forbidden.”

## Slide 6 — Tests that prove the fix (about 75 seconds)

**Say:**

“The existing `scratch/test_role_security.js` checks token signing and basic middleware behavior, but it does not test public registration, role changes, mass assignment, or route-level denials. It also invokes the seed routine, so it is not safe to treat as a general-purpose test against shared data.

“We need API-level tests using an isolated test database and test-only signing key. At minimum: anonymous admin registration must create no account; non-admins must be denied user creation, role changes, status changes, and edits to other users; attempted writes to role, status, or password-hash fields must be rejected; invalid roles must not be accepted; old, expired, tampered, or query-string tokens must fail; and a token that claims Admin must still be treated as Inspector if the database says Inspector.

“Then we need a route authorization matrix for all four roles across every mutating endpoint. That catches alternate paths outside the user-management routes.”

**Acceptance line:** “Every denied request should prove both the right HTTP response and that no underlying record changed.”

## Slide 7 — Release, rotation, and recovery (about 65 seconds)

**Say:**

“We should deploy this as a controlled security release. Before rollout, identify the trusted administrator and take a verified backup. Deploy the code that blocks public registration and fallback authentication, configure the new unique signing secret through the deployment secret manager, then rotate it. Communicate that existing sessions will need to sign in again.

“After deployment, verify real login, `/api/auth/me`, Admin-only provisioning, denial for non-admins, and immediate behavior after suspension or role change. Monitor failed login attempts and role changes.

“Our rollback principle is important: don’t restore the vulnerable endpoint or the known JWT secret as a quick rollback. If the secure release fails, disable account and role mutations or put the API into maintenance mode while we fix it. Document an offline break-glass administrator recovery path.”

## Slide 8 — Decisions and next steps (about 45 seconds)

**Say:**

“To move forward, I’m asking the team to align on five items: one, whether public registration is needed; two, whether invitation acceptance should always start at Inspector; three, who owns provisioning and break-glass recovery; four, the session-revocation behavior we require after role or status changes; and five, the production secret-rotation window and user communication.

“Once those are agreed, engineering can implement in the sequence in the remediation plan, QA can build the isolated role matrix, and platform can update managed secrets and production settings. We should consider the work complete only when the negative tests pass, production has no shared credentials or default signing key, and audit/recovery behavior is verified.”

**Close:** “The target is not just a login that works. It is a system where privilege is explicit, server-owned, testable, and reversible through a safe operational process.”

---

## Likely questions and suggested answers

**“Are we saying the system has already been compromised?”**  
“No. This was a read-only code review. It identified exploitable-looking code paths and configuration risks; it did not establish that anyone used them.”

**“Why not just add a role check to registration?”**  
“Registration is unauthenticated, so a caller has no trusted role to check. The endpoint should be retired or use a one-time invitation that cannot choose its own role. Elevated roles belong in a separate Admin-only action.”

**“Can the frontend hide the Admin option?”**  
“That improves presentation but is not a security control. A caller can invoke the API directly. Authorization must be enforced on every backend route.”

**“Will rotating the JWT secret interrupt users?”**  
“Yes. Tokens signed by the old key will stop validating, so users will need to sign in again. We should plan and communicate that explicitly.”

**“Can we keep demo logins for judging?”**  
“Yes, in an isolated demo deployment with an explicit non-production flag and synthetic/demo data. They should not authenticate against production accounts or production services.”

**“Is the current role check useless?”**  
“No. Reloading the user record and using its current role is a valuable control. The remediation preserves it and strengthens route coverage, field validation, and session revocation.”

## Presenter checklist

- State clearly that this is a proposed remediation based on code review, not proof of exploitation.
- Do not read secret values or demo passwords aloud.
- Distinguish confirmed code behavior from implementation choices still requiring team agreement.
- Leave time to decide registration policy, invitation role, revocation expectations, and rollout timing.
- Point the team to the companion remediation plan for exact source paths, detailed acceptance tests, and implementation sequencing.
