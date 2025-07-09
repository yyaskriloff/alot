import { Hono } from 'hono'
import db, { drivesTable, region, orgsTable, usersTable } from '../db'
import { eq } from 'drizzle-orm'
import { zValidator as validator } from '@hono/zod-validator'
import { z } from 'zod/v4'
import { clerkClient } from '../lib/clerk'
import { getDriveContext } from '../middlleware'
import { Permissions } from '../lib/utils'
import { getAuth } from '@hono/clerk-auth'

const driveRoute = new Hono()

driveRoute.get('/', async c => {
  const user = c.get('user')

  console.log(user)

  const personalDrive = await db.query.drivesTable.findMany({
    where: eq(drivesTable.ownerId, user.id)
  })

  return c.json([...personalDrive])
})

driveRoute.post(
  '/',
  validator(
    'json',
    z
      .object({
        name: z.string().min(1, 'Name is required'),
        slug: z.string().min(1, 'Slug is required'),
        region: z.enum(region.enumValues),
        type: z.literal('organization')
      })
      .or(
        z.object({
          region: z.enum(region.enumValues),
          type: z.literal('personal')
        })
      )
  ),
  async c => {
    const user = c.get('user')

    const body = c.req.valid('json')

    if (body.type === 'personal') {
      // insert drive into database

      const [newDrive] = await db
        .insert(drivesTable)
        .values({
          type: body.type,
          region: body.region,
          ownerId: user.id
        })
        .onConflictDoNothing()
        .returning()

      return c.json(newDrive, 201)
    }

    // create new org in clerk
    const newOrg = await clerkClient.organizations.createOrganization({
      name: body.name,
      slug: body.slug
    })

    clerkClient.organizations.createOrganizationMembership({
      organizationId: newOrg.id,
      userId: user.clerkId,
      role: 'owner'
    })

    //create new org in db
    const [newOrgDb] = await db
      .insert(orgsTable)
      .values({
        name: newOrg.name,
        slug: newOrg.slug,
        clerkId: newOrg.id
      })
      .onConflictDoNothing()
      .returning()

    if (!newOrgDb) {
      return c.json({ error: 'Failed to create organization' }, 500)
    }

    const [newDrive] = await db
      .insert(drivesTable)
      .values({
        type: 'organization',
        region: body.region,
        ownerId: newOrgDb.id
      })
      .onConflictDoNothing()
      .returning()

    // create drive linking org to drive
    return c.json(newDrive, 201)
  }
)

driveRoute.get('/:driveId', getDriveContext(), async c => {
  const drive = c.get('drive')

  return c.json(drive)
})

driveRoute.put('/:driveId', getDriveContext(Permissions.MANAGE_DRIVE), async c => {
  const user = c.get('user')
})

driveRoute.delete('/:driveId', getDriveContext(Permissions.DELETE_DRIVE), async c => {
  const drive = c.get('drive')

  await db
    .update(drivesTable)
    .set({
      ownerId: null,
      deleted: true
    })
    .where(eq(drivesTable.id, drive.id))

  return c.body(null, 204)
})

driveRoute.put('/:driveId/detach', getDriveContext(Permissions.DELETE_DRIVE), async c => {
  const drive = c.get('drive')

  await db
    .update(drivesTable)
    .set({
      ownerId: null
    })
    .where(eq(drivesTable.id, drive.id))

  return c.body(null, 204)
})

driveRoute.put('/:driveId/attach', getDriveContext(Permissions.DELETE_DRIVE), async c => {
  const user = c.get('user')
})

driveRoute.get('/:driveId/members', getDriveContext(Permissions.READ_MEMBERS), async c => {
  const user = c.get('user')
})

driveRoute.put(
  '/:driveId/members',
  validator('json', z.object({ email: z.email(), role: z.string() })),
  getDriveContext(Permissions.MANAGE_MEMBERS),
  async c => {
    const orgId = getAuth(c)?.orgId

    if (!orgId) {
      return c.json({ error: 'Organization not found' }, 404)
    }

    const { email, role } = c.req.valid('json')

    await clerkClient.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: email,
      role
    })

    return c.body(null, 204)
  }
)

driveRoute.delete(
  '/:driveId/members',
  validator('json', z.object({ email: z.email() })),
  getDriveContext(Permissions.MANAGE_MEMBERS),
  async c => {
    const orgId = getAuth(c)?.orgId

    if (!orgId) {
      return c.json({ error: 'Organization not found' }, 404)
    }

    const userToRemove = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, c.req.valid('json').email),
      columns: {
        clerkId: true
      }
    })

    if (!userToRemove) {
      return c.json({ error: 'User not found' }, 404)
    }

    await clerkClient.organizations.deleteOrganizationMembership({
      organizationId: orgId,
      userId: userToRemove.clerkId
    })

    return c.body(null, 204)
  }
)

export default driveRoute
