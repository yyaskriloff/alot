import { DbDrive, DbOrg, DbUser } from '../db'

const CHECK_INTERVAL = 60
const TTL = 60 * 60

type Options = {
  ttl?: number
  checkInterval?: number
}

export default function cache<T = any>(options: Options = {}) {
  const data = new Map<string, { value: T; ttl: number }>()
  const instance = {
    ...{
      ttl: TTL,
      checkInterval: CHECK_INTERVAL
    },
    ...options
  }

  const checkValues = () => {
    const now = Date.now()
    for (const [key, item] of data) {
      if (item.ttl < now) {
        data.delete(key)
      }
    }

    setTimeout(checkValues, instance.checkInterval * 1000)
  }

  const getValue = (key: string) => {
    const item = data.get(key)
    if (!item) return null
    if (item.ttl < Date.now()) {
      data.delete(key)
      return null
    }
    return item.value
  }

  const setValue = (key: string, value: T, ttl: number) => {
    data.set(key, { value, ttl: Date.now() + ttl * 1000 })
  }

  const delValue = (key: string) => {
    data.delete(key)
  }

  setTimeout(checkValues, instance.checkInterval * 1000)

  return {
    get(key: string /*, cb?: (key: string) => T*/) {
      // const value = getValue(key)
      // if (value) return value
      // return cb? cb(key): null

      return getValue(key)
    },
    mget(keys: string[]) {
      return keys.map(getValue)
    },
    set(key: string, value: T, ttl?: number) {
      setValue(key, value, ttl || 60 * 60)
      return true
    },
    mset(inserts: { key: string; value: T; ttl: number }[]) {
      inserts.forEach(({ key, value, ttl }) => setValue(key, value, ttl))
      return true
    },
    del(key: string) {
      return delValue(key)
    },
    take(key: string) {
      const value = getValue(key)
      delValue(key)
      return value
    },
    ttl(key: string, ttl: number) {
      const item = data.get(key)
      if (!item) return false
      if (ttl >= 0) {
        item.ttl = Date.now() + ttl
      } else {
        data.delete(key)
      }
      return true
    },
    getTtl(key: string) {
      const item = data.get(key)
      if (!item) return false
      return item.ttl - Date.now()
    },
    keys() {
      return Array.from(data.keys())
    },
    has(key: string) {
      return data.has(key)
    }
  }
}

export const userCache = cache<DbUser>()
export const driveCache = cache<DbDrive>({
  ttl: 60 * 5
})
export const orgCache = cache<DbOrg>()
