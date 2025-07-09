import { createClerkClient, type User } from '@clerk/backend'
import cache from './cache'

// cache
const userCache = cache<User>({
  ttl: 60 * 5
})

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
})

export const getClerkUser = async (userId: string) => {
  if (userCache.get(userId)) {
    return userCache.get(userId)!
  }

  const user = await clerkClient.users.getUser(userId)
  userCache.set(userId, user)

  return user
}

export const invalidateClerkUser = async (userId: string) => userCache.del(userId)
