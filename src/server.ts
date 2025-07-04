import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import storageRoute from './routes/storage'
import settingsRoute from './routes/settings'
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
import db from './db'
import driveRoute from './routes/drive'
import { getUser } from './middlleware'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: ['http://localhost:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
)

app.get('/', c => {
  return c.text('Hello Hono!')
})

app.use('*', clerkMiddleware())

app.get('/me', async c => {
  const auth = getAuth(c)

  if (!auth || !auth.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const user = await db.query.usersTable.findFirst({
    where: (usersTable, { eq }) => eq(usersTable.clerkId, auth.userId)
  })

  return c.json(user)
})

// app.route('/account')
app.use('/drives/*', getUser)
app.route('/drives', driveRoute)
app.route('/drives/:driveId/storage', storageRoute)
app.route('/drives/:driveId/settings', settingsRoute)

serve(
  {
    fetch: app.fetch,
    port: 3000
  },
  info => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)
