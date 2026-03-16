import { oauthCallback } from '@/lib/auth/oauth-routes'

export async function GET(request: Request) {
  return oauthCallback('google', request)
}
