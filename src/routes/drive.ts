import { Hono } from 'hono'
import db from '../db'

const driveRoute = new Hono()

driveRoute.get('/', async c => {
  const user = c.get('user')

  return c.json([])
})

export default driveRoute
