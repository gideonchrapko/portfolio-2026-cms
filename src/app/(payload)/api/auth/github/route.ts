import { NextResponse } from 'next/server'

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'GitHub OAuth not configured' }, { status: 503 })
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SERVER_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')

  const redirectUri = `${baseUrl}/api/auth/github/callback`
  const scope = encodeURIComponent('user:email read:user')
  const url = `${GITHUB_AUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`

  return NextResponse.redirect(url)
}
