# Auth Rollout Checklist

Use this checklist to roll out the new authentication flow safely.

1. **Feature flag new auth**
   - Gate all new auth paths (`sign-up`, `sign-in`, `oauth callback`, `sign-out`, `session`) behind a runtime feature flag.
   - Keep legacy auth available until success criteria are met.

2. **Staging OAuth app configuration**
   - Create/update staging OAuth apps for Google and Microsoft.
   - Verify callback URLs include `/api/auth/oauth/callback`.
   - Validate provider-specific scopes and consent screens.

3. **Seed/migrate users**
   - Seed admin, shura, and representative member test users in staging.
   - Migrate existing users and verify role mapping (`admin`, `shura`, `member`, etc.).
   - Smoke test sign-in for each role.

4. **Monitor auth failure rates and denied-access logs**
   - Track failed sign-ins and OAuth callback errors.
   - Monitor denied-access events from route guards for `/admin` and `/shura`.
   - Set temporary alerts during initial rollout window.

5. **Cutover and rollback strategy documented**
   - Define cutover window and owner.
   - Document rollback trigger conditions.
   - Keep rollback steps ready: disable feature flag, invalidate new sessions, revert to legacy auth path.
