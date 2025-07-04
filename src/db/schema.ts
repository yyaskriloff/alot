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
  type AnyPgColumn
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

export const usersTable = pgTable('users', {
  id: uuid().defaultRandom().primaryKey(),
  firstName: varchar({ length: 255 }).notNull(),
  lastName: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  clerkId: varchar({ length: 255 }).notNull().unique()
})

export const orgsTable = pgTable('organizations', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  bio: text().notNull(),
  doi: timestamp('date_of_incorporation', { mode: 'date' }).notNull(),
  updatedAt: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow()
})

export const drivesTable = pgTable('drives', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 255 }),
  type: driveType().notNull().default('personal'),
  ownerId: uuid(),
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
