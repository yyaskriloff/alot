import { createClerkClient, type User } from '@clerk/backend'

// cache
const cache = new Map<string, User>()

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
})

export const getClerkUser = async (userId: string) => {
  if (cache.has(userId)) {
    return cache.get(userId)!
  }

  const user = await clerkClient.users.getUser(userId)
  cache.set(userId, user)

  return user
}

export const invalidateClerkUser = async (userId: string) => cache.delete(userId)
