import { Hono } from 'hono'
import db, { drivesTable } from '../db'
import { eq } from 'drizzle-orm'
import { zValidator as validator } from '@hono/zod-validator'
import { insertDriveSchema } from '../db'
import { z } from 'zod/v4'

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
    insertDriveSchema.omit({
      id: true,
      ownerId: true,
      storageUsed: true,
      storageLimit: true,
      createdAt: true,
      updatedAt: true
    })
  ),
  async c => {
    const user = c.get('user')
  }
)

driveRoute.get('/:id', async c => {
  const user = c.get('user')
})

driveRoute.put('/:id', async c => {
  const user = c.get('user')
})

driveRoute.delete('/:id', async c => {
  const user = c.get('user')
})

driveRoute.put('/:id/detach', async c => {
  const user = c.get('user')
})

driveRoute.put('/:id/attach', async c => {
  const user = c.get('user')
})

export default driveRoute
