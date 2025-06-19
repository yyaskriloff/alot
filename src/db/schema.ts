import { integer, pgTable, varchar, pgEnum, text, timestamp, primaryKey } from 'drizzle-orm/pg-core'

const titleEnum = pgEnum('title', ['Rabbi', 'Reb', 'Rebbetzin', 'Rav', 'Dr'])
const status = pgEnum('status', ['waiting', 'proccessing', 'archived', 'error'])

export const usersTable = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique()
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

export const profilesTable = pgTable('profiles', {
  title: titleEnum(),
  firstName: varchar({ length: 255 }).notNull(),
  lastName: varchar({ length: 255 }).notNull(),
  bio: text().notNull(),
  dob: timestamp({ mode: 'date' }).notNull(),
  dod: timestamp({ mode: 'date' }),
  updatedAt: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow()
})

// this is archived files
export const uploadsTable = pgTable('uploads', {
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  key: varchar({ length: 64 }).notNull().unique(),
  size: integer().notNull(),
  type: varchar({ length: 64 }).notNull(),
  status: status().notNull().default('waiting'),
  updatedAt: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow()
})

// archived playlists
export const playlistsTable = pgTable('playlists', {
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  updatedAt: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow()
})

// archived playlist uploads
export const playlistUploadsTable = pgTable('playlist_uploads', {
  playlistId: integer().notNull(),
  uploadId: integer().notNull(),
  position: integer().notNull().default(0)
})

export const directoriesTable = pgTable('directories', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  path: text().unique(),
  ownerId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow()
})

export const filesTable = pgTable('files', {
  name: varchar({ length: 255 }).notNull(),
  key: varchar({ length: 64 }).notNull().unique(),
  size: integer().notNull(),
  type: varchar({ length: 64 }).notNull(),
  parentFolder: integer()
    .notNull()
    .references(() => directoriesTable.id, { onDelete: 'cascade' })
})
