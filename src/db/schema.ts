import {
  integer,
  pgTable,
  varchar,
  text,
  timestamp,
  serial,
  boolean,
  uuid,
  date,
  pgEnum,
  char,
  type AnyPgColumn,
  bigint,
  uniqueIndex,
  primaryKey
} from 'drizzle-orm/pg-core'

// const titleEnum = pgEnum('title', ['Rabbi', 'Reb', 'Rebbetzin', 'Rav', 'Dr'])
// const status = pgEnum('status', ['waiting', 'proccessing', 'archived', 'error'])

export const socialPlatforms = pgEnum('social_platforms', [
  'facebook',
  'instagram',
  'google',
  'linkedin',
  'dropbox',
  'tiktok',
  'x',
  'threads',
  'youtube'
])

export const driveType = pgEnum('drive_type', ['personal', 'organization'])

export const subscriptionStatus = pgEnum('subscription_status', ['active', 'inactive', 'expired'])

export const region = pgEnum('region', ['us', 'eu', 'is'])

export const usersTable = pgTable('users', {
  id: uuid().defaultRandom().primaryKey(),
  firstName: varchar({ length: 255 }).notNull(),
  lastName: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  clerkId: varchar({ length: 255 }).notNull().unique()
})

export const orgsTable = pgTable(
  'organizations',
  {
    id: uuid().defaultRandom().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull().unique(),
    clerkId: varchar({ length: 255 }).notNull().unique(),
    bio: text(),
    doi: timestamp('date_of_incorporation', { mode: 'date' }),
    updatedAt: timestamp({ mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdAt: timestamp({ mode: 'date' }).notNull().defaultNow()
  },
  table => [uniqueIndex('org_slug').on(table.slug), uniqueIndex('org_clerk_id').on(table.clerkId)]
)

export const drivesTable = pgTable('drives', {
  id: uuid().defaultRandom().primaryKey(),
  type: driveType().notNull().default('personal'),
  storageUsed: bigint({ mode: 'number' })
    .notNull()
    .$default(() => 0),
  storageLimit: bigint({ mode: 'number' })
    .notNull()
    .$default(() => 1024 * 1024 * 1024 * 20),
  region: region().notNull().default('us'),
  ownerId: uuid().unique(),
  deleted: boolean().notNull().default(false),
  updatedAt: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow()
})

export const foldersTable = pgTable('folders', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  driveId: uuid()
    .notNull()
    .references(() => drivesTable.id, { onDelete: 'cascade' }),
  parentId: uuid().references((): AnyPgColumn => foldersTable.id, { onDelete: 'cascade' }),
  trash: boolean().notNull().default(false),
  delete: date({ mode: 'date' }),
  updatedAt: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow()
})

export const filesTable = pgTable('files', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  size: integer().notNull(),
  type: varchar({ length: 64 }).notNull(),
  trash: boolean().notNull().default(false),
  delete: date({ mode: 'date' }),
  parentFolder: uuid().references(() => foldersTable.id, { onDelete: 'cascade' }),
  driveId: uuid()
    .references(() => drivesTable.id, { onDelete: 'cascade' })
    .notNull(),
  updatedAt: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow()
})

export const subscriptionTable = pgTable('subscription', {
  id: varchar({ length: 64 }).notNull().primaryKey(),
  type: driveType(),
  paymentMethod: varchar({ length: 64 }).notNull(),
  last4: char({ length: 4 }).notNull(),
  status: subscriptionStatus().notNull().default('active'),
  startDate: timestamp({ mode: 'date' }).notNull(),
  endDate: timestamp({ mode: 'date' }).notNull(),
  driveId: uuid()
    .references(() => drivesTable.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  updatedAt: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow()
})
