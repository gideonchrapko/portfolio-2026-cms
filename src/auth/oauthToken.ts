import crypto from 'node:crypto'

const OAUTH_TOKEN_COOKIE = 'payload-oauth-token'
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function getOAuthTokenCookieName(): string {
  return OAUTH_TOKEN_COOKIE
}

export function createOAuthToken(userId: number | string, secret: string): string {
  const payload = {
    userId: String(userId),
    exp: Date.now() + TOKEN_EXPIRY_MS,
  }
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verifyOAuthToken(token: string, secret: string): { userId: string } | null {
  try {
    const [data, sig] = token.split('.')
    if (!data || !sig) return null
    const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url')
    if (sig !== expected) return null
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as {
      userId: string
      exp: number
    }
    if (Date.now() > payload.exp) return null
    return { userId: payload.userId }
  } catch {
    return null
  }
}
