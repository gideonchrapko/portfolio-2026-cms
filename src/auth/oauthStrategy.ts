import type { AuthStrategy } from 'payload'
import { getOAuthTokenCookieName, verifyOAuthToken } from './oauthToken'

export function createOAuthStrategy(secret: string): AuthStrategy {
  return {
    name: 'oauth',
    authenticate: async ({ headers, payload }) => {
      const cookieHeader = headers.get('cookie')
      if (!cookieHeader) return { user: null }

      const name = getOAuthTokenCookieName()
      const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`))
      const token = match?.[1]?.trim()
      if (!token) return { user: null }

      const parsed = verifyOAuthToken(decodeURIComponent(token), secret)
      if (!parsed) return { user: null }

      const userDoc = await payload.findByID({
        collection: 'users',
        id: parsed.userId,
        depth: 0,
      })

      if (!userDoc) return { user: null }

      return {
        user: {
          ...userDoc,
          collection: 'users',
        },
      }
    },
  }
}
