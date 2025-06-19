import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from './schema'
export * from './schema'
// import * as relations from './relations'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!
})

const db = drizzle(pool, {
  schema: {
    ...schema
    //   ...relations
  }
})

export default db
