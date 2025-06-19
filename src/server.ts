import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { PostHog } from 'posthog-node'
import driveRoute from './routes/drive'

const client = new PostHog('phc_kyRsR2QdYkqhrEldJKhnZbFe1Rrxk6pIn7kLDAkS8Bv', {
  host: 'https://us.i.posthog.com'
})

const app = new Hono()

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
