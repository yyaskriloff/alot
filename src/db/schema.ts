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
  jsonb,
  type AnyPgColumn
} from 'drizzle-orm/pg-core'
import { json } from 'stream/consumers'

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

export const usersTable = pgTable('users', {
  id: serial().primaryKey(),
  firstName: varchar({ length: 255 }).notNull(),
  lastName: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  clerkId: varchar({ length: 255 }).notNull().unique()
})

export const orgsTable = pgTable('organizations', {
  name: varchar({ length: 255 }).notNull(),
  bio: text().notNull(),
  doi: timestamp('date_of_incorporation', { mode: 'date' }).notNull(),
  updatedAt: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow()
})

export const foldersTable = pgTable('folders', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  ownerId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
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
  ownerId: integer()
    .references(() => usersTable.id, { onDelete: 'cascade' })
    .notNull(),
  updatedAt: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow()
})

export const socialTokensTable = pgTable('social_tokens', {
  token: varchar({ length: 512 }).notNull(),
  refreshToken: varchar({ length: 512 }).notNull(),
  expiresAt: timestamp({ mode: 'date' }).notNull(),
  platform: socialPlatforms().notNull(),
  userId: integer()
    .references(() => usersTable.id, { onDelete: 'cascade' })
    .notNull(),
  updatedAt: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow()
})

export const socialPostsTable = pgTable('social_posts', {
  id: uuid().defaultRandom().primaryKey(),
  socialId: varchar({ length: 255 }).notNull(),
  content: jsonb().notNull(),
  platform: socialPlatforms().notNull(),
  draft: boolean().notNull().default(false),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  contentContainer: varchar({ length: 255 }).notNull(),
  userId: integer()
    .references(() => usersTable.id, { onDelete: 'cascade' })
    .notNull()
})

export const scheduledSocialPostsTable = pgTable('scheduled_social_posts', {
  id: uuid().defaultRandom().primaryKey(),
  content: jsonb().notNull(),
  platform: socialPlatforms().notNull(),
  scheduledAt: timestamp({ mode: 'date' }),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  contentContainer: varchar({ length: 255 }).notNull(),
  userId: integer()
    .references(() => usersTable.id, { onDelete: 'cascade' })
    .notNull()
})
