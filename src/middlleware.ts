//  auth user
//  user
//  persinalDrives
//  orgDrives
// currentDrive

import { createMiddleware } from 'hono/factory'
import { getAuth } from '@hono/clerk-auth'
import { getClerkUser, clerkClient } from './lib/clerk'
import db, { type DbUser } from './db'

const userCache = new Map<string, DbUser>()

export const getUser = createMiddleware(async (c, next) => {
  const auth = getAuth(c)

  if (!auth || !auth.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const clerkUser = await getClerkUser(auth.userId)

  c.set('clerkUser', clerkUser)

  if (clerkUser.externalId) {
    const setUser = userCache.get(clerkUser.externalId)
    if (setUser) {
      c.set('user', setUser)
      return next()
    }

    const user = await db.query.usersTable.findFirst({
      where: (usersTable, { eq }) => eq(usersTable.clerkId, auth.userId.replace('user_', ''))
    })

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    c.set('user', user)
    return next()
  }

  const user = await db.query.usersTable.findFirst({
    where: (usersTable, { eq }) => eq(usersTable.clerkId, auth.userId.replace('user_', ''))
  })

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  clerkClient.users.updateUser(auth.userId, {
    externalId: user.id
  })

  userCache.set(user.id, user)

  c.set('user', user)

  await next()
})

export const getDriveContext = createMiddleware(async (c, next) => {
  await next()
})
