import type { ReactNode } from 'react'

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'account_exists'
  | 'provider_mismatch'
  | 'account_not_found'
  | 'email_required'
  | 'password_required'
  | 'password_too_short'
  | 'password_mismatch'
  | 'unknown_error'

const authErrorMessages: Record<AuthErrorCode, string> = {
  invalid_credentials: 'Invalid email or password. Please try again.',
  account_exists: 'An account with this email already exists.',
  provider_mismatch: 'This account uses a different sign-in provider.',
  account_not_found: 'No account found for this email address.',
  email_required: 'Please enter a valid email address.',
  password_required: 'Please enter your password.',
  password_too_short: 'Password must be at least 8 characters.',
  password_mismatch: 'Passwords do not match.',
  unknown_error: 'Something went wrong. Please try again.',
}

export function getAuthErrorMessage(code?: string): string {
  if (!code) return authErrorMessages.unknown_error
  return authErrorMessages[(code as AuthErrorCode)] ?? authErrorMessages.unknown_error
}

export function validateEmail(email: string): AuthErrorCode | null {
  const isValid = /\S+@\S+\.\S+/.test(email.trim())
  return isValid ? null : 'email_required'
}

export function validateSignInForm(email: string, password: string): AuthErrorCode | null {
  return validateEmail(email) ?? (!password ? 'password_required' : null)
}

export function validateSignUpForm(
  email: string,
  password: string,
  confirmPassword: string,
): AuthErrorCode | null {
  return (
    validateEmail(email) ??
    (!password ? 'password_required' : null) ??
    (password.length < 8 ? 'password_too_short' : null) ??
    (password !== confirmPassword ? 'password_mismatch' : null)
  )
}

export function renderInlineAuthError(errorCode: string | null): ReactNode {
  if (!errorCode) return null
  return <p className="text-sm text-destructive">{getAuthErrorMessage(errorCode)}</p>
}
