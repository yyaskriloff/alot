import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import driveRoute from './routes/drive'

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

app.route('/drive', driveRoute)

serve(
  {
    fetch: app.fetch,
    port: 3000
  },
  info => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)
