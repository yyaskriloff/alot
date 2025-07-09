import { createMiddleware } from 'hono/factory'
import { getAuth } from '@hono/clerk-auth'
import { getClerkUser, clerkClient } from './lib/clerk'
import db from './db'
import { userCache, driveCache, orgCache } from './lib/cache'
import { Permissions } from './lib/utils'

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

export const getDriveContext = (...permissionsNeeded: Permissions[]) =>
  createMiddleware(async (c, next) => {
    const driveId = c.req.param('driveId') || c.req.query('driveId')
    const user = c.get('user')

    if (!driveId) {
      return c.json({ error: 'Drive ID is required' }, 400)
    }

    // make sure drive exists and save it to cache
    if (!driveCache.has(driveId)) {
      const drive = await db.query.drivesTable.findFirst({
        where: (drivesTable, { eq }) => eq(drivesTable.id, driveId)
      })

      if (!drive) {
        return c.json({ error: 'Drive not found' }, 404)
      }

      driveCache.set(driveId, drive)
    }

    const drive = driveCache.get(driveId)!

    //  if the drive is personal, check if the user is the owner
    if (drive.type === 'personal') {
      if (drive.ownerId !== user.id) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      c.set('drive', drive)
      return next()
    }

    // if the drive is an org, check if the user is a member of the org and has the required permissions
    const auth = getAuth(c)!

    const clerkOrgId = auth!.orgId

    if (typeof clerkOrgId !== 'string') {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (!orgCache.has(clerkOrgId)) {
      const org = await db.query.orgsTable.findFirst({
        where: (orgsTable, { eq, and }) => and(eq(orgsTable.clerkId, clerkOrgId))
      })

      if (!org) {
        return c.json({ error: 'Organization not found' }, 404)
      }

      orgCache.set(clerkOrgId, org)
    }

    const org = orgCache.get(clerkOrgId)!

    if (drive.ownerId !== org.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (permissionsNeeded.length > 0) {
      const userPermissions = auth.orgPermissions || []

      const hasPermission = permissionsNeeded.every(permission => userPermissions.includes(permission))
      if (!hasPermission) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
    }

    c.set('drive', drive)
    return next()
  })
