import { Hono } from 'hono'
import db, { drivesTable, region, orgsTable } from '../db'
import { eq } from 'drizzle-orm'
import { zValidator as validator } from '@hono/zod-validator'
import { z } from 'zod/v4'
import { clerkClient } from '../lib/clerk'
import { getDriveContext } from '../middlleware'
import { Permissions } from '../lib/utils'

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

driveRoute.get('/:id', getDriveContext(), async c => {
  const drive = c.get('drive')

  return c.json(drive)
})

driveRoute.put('/:id', getDriveContext(Permissions.MANAGE_DRIVE), async c => {
  const user = c.get('user')
})

driveRoute.delete('/:id', getDriveContext(Permissions.DELETE_DRIVE), async c => {
  const user = c.get('user')
})

driveRoute.put('/:id/detach', getDriveContext(Permissions.DELETE_DRIVE), async c => {
  const user = c.get('user')
})

driveRoute.put('/:id/attach', getDriveContext(Permissions.DELETE_DRIVE), async c => {
  const user = c.get('user')
})

export default driveRoute
