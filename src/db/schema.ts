import { integer, pgTable, varchar, text, timestamp, serial, uuid } from 'drizzle-orm/pg-core'

// const titleEnum = pgEnum('title', ['Rabbi', 'Reb', 'Rebbetzin', 'Rav', 'Dr'])
// const status = pgEnum('status', ['waiting', 'proccessing', 'archived', 'error'])

export const usersTable = pgTable('users', {
  id: integer().primaryKey(),
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

export const foldersTable = pgTable('folders', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  ownerId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  parentId: uuid(),
  updatedAt: timestamp({ mode: 'date' })
    .notNull()
    .$onUpdate(() => new Date()),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow()
})

export const filesTable = pgTable('files', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  key: varchar({ length: 64 }).notNull().unique(),
  size: integer().notNull(),
  type: varchar({ length: 64 }).notNull(),
  parentFolder: uuid().references(() => foldersTable.id, { onDelete: 'cascade' }),
  ownerId: integer()
    .references(() => usersTable.id, { onDelete: 'cascade' })
    .notNull(),
  updatedAt: timestamp({ mode: 'date' })
    .notNull()
    .$onUpdate(() => new Date()),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow()
})
