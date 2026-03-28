# Sign-In Guide

This project uses cookie-based auth backed by `mc_session`, and supports role-based landing pages after successful sign in.

## Current Sign-In Flow

1. User submits email/password from `/auth/sign-in`.
2. Client validates basic form constraints before making network request.
3. `POST /api/auth/sign-in` validates payload with Zod.
4. Credentials are checked through `authenticateWithCredentials`.
5. On success, server creates a new session token and sets `mc_session` cookie.
6. Server response now includes `redirectTo` based on role (`admin`, `shura`, `member`, etc.).
7. Client redirects to that role-appropriate destination.

## Why this fixes the issue

Previously the sign-in page always redirected to `/admin` after success. That causes non-admin users to hit authorization guards and see "Sign in required" or forbidden flows even though auth succeeded.

By returning and using `redirectTo`, users go directly to the correct dashboard:

- `admin` -> `/admin`
- `shura` -> `/shura`
- `mosque_admin`/`member` -> `/community`
- `visitor` -> `/mosques`

## Expected Behavior

- Valid credentials create a session and route user to their allowed section.
- Invalid credentials return generic auth error and do not set session.
- Switching account still signs out the current cookie-backed session first.

## Files involved

- `app/api/auth/sign-in/route.ts`
- `app/auth/sign-in/page.tsx`
- `lib/auth/server.ts` (role-home mapping source)
