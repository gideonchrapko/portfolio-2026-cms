import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createOAuthToken, getOAuthTokenCookieName } from '@/auth/oauthToken'
import { getServerSideURL } from '@/utilities/getURL'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  const baseUrl = getServerSideURL()
  const redirectUri = `${baseUrl}/api/auth/github/callback`
  const adminUrl = `${baseUrl}/admin`

  if (error) {
    return NextResponse.redirect(`${adminUrl}/login?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${adminUrl}/login?error=missing_code`)
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  const secret = process.env.PAYLOAD_SECRET

  if (!clientId || !clientSecret || !secret) {
    return NextResponse.redirect(`${adminUrl}/login?error=oauth_not_configured`)
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    console.error('GitHub token error', err)
    return NextResponse.redirect(`${adminUrl}/login?error=token_exchange_failed`)
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string }
  if (tokenData.error || !tokenData.access_token) {
    return NextResponse.redirect(`${adminUrl}/login?error=token_exchange_failed`)
  }

  const profileRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github+json',
    },
  })

  if (!profileRes.ok) {
    return NextResponse.redirect(`${adminUrl}/login?error=profile_fetch_failed`)
  }

  const profile = (await profileRes.json()) as { id: number; email?: string; name?: string; login?: string }

  let email = profile.email
  if (!email) {
    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
      },
    })
    if (emailsRes.ok) {
      const emails = (await emailsRes.json()) as Array<{ email: string; primary: boolean }>
      email = emails.find((e) => e.primary)?.email ?? emails[0]?.email
    }
  }

  const payload = await getPayload({ config: configPromise })
  const githubIdStr = String(profile.id)

  let user = (
    await payload.find({
      collection: 'users',
      where: {
        or: [
          { githubId: { equals: githubIdStr } },
          ...(email ? [{ email: { equals: email } }] : []),
        ],
      },
      limit: 1,
    })
  ).docs[0]

  if (!user) {
    const randomPassword = crypto.randomBytes(32).toString('hex')
    const createRes = await payload.create({
      collection: 'users',
      data: {
        email: email || `${profile.id}@github.oauth`,
        name: profile.name || profile.login || 'User',
        password: randomPassword,
        githubId: githubIdStr,
      },
    })
    user = createRes
  } else if (!user.githubId) {
    user = await payload.update({
      collection: 'users',
      id: user.id,
      data: { githubId: githubIdStr },
    })
  }

  const token = createOAuthToken(user.id, secret)
  const cookieName = getOAuthTokenCookieName()
  const res = NextResponse.redirect(adminUrl)
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: baseUrl.startsWith('https'),
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return res
}
