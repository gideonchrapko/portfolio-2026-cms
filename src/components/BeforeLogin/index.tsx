import React from 'react'
import Link from 'next/link'

const BeforeLogin: React.FC = () => {
  return (
    <div>
      <p>
        <b>Welcome to your dashboard!</b>
        {' This is where site admins will log in to manage your website.'}
      </p>
      <div style={{ marginTop: '1rem' }}>
        <Link
          href="/api/auth/github"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            background: '#24292f',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          Sign in with GitHub
        </Link>
      </div>
    </div>
  )
}

export default BeforeLogin
