import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import driveRoute from './routes/drive'
import settingsRoute from './routes/settings'
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'

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

  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  console.log({ auth })

  return c.json({ userId: auth.userId })
})

app.route('/drive', driveRoute)
app.route('/settings', settingsRoute)

serve(
  {
    fetch: app.fetch,
    port: 3000
  },
  info => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)
