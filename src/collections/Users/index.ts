import type { CollectionConfig } from 'payload'

import { createOAuthStrategy } from '@/auth/oauthStrategy'
import { authenticated } from '../../access/authenticated'

const secret = process.env.PAYLOAD_SECRET || ''

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: {
    strategies: [...(secret ? [createOAuthStrategy(secret)] : [])],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'githubId',
      type: 'text',
      admin: { readOnly: true, description: 'Set when user signs in with GitHub' },
      index: true,
      unique: true,
    },
  ],
  timestamps: true,
}
