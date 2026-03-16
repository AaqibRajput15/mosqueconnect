import { oauthStart } from '@/lib/auth/oauth-routes'

export async function GET(request: Request) {
  return oauthStart('microsoft', request)
}
