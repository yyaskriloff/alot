import { integer, pgTable, varchar, text, timestamp, serial } from 'drizzle-orm/pg-core'

// const titleEnum = pgEnum('title', ['Rabbi', 'Reb', 'Rebbetzin', 'Rav', 'Dr'])
// const status = pgEnum('status', ['waiting', 'proccessing', 'archived', 'error'])

export const usersTable = pgTable('users', {
  id: serial().primaryKey(),
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
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  ownerId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  parentId: integer(),
  updatedAt: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow()
})

export const filesTable = pgTable('files', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  key: varchar({ length: 64 }).notNull().unique(),
  size: integer().notNull(),
  type: varchar({ length: 64 }).notNull(),
  parentFolder: integer().references(() => foldersTable.id, { onDelete: 'cascade' }),
  ownerId: integer()
    .references(() => usersTable.id, { onDelete: 'cascade' })
    .notNull(),
  updatedAt: timestamp({ mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow()
})
