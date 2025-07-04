import { type User as ClerkUser } from '@clerk/backend'
import { type DbUser } from './src/db'

declare module 'hono' {
  interface ContextVariableMap {
    clerkUser: ClerkUser
    user: DbUser
  }
}
