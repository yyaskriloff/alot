import { relations } from 'drizzle-orm'
import { usersTable, orgsTable, driveTable } from './schema'

export const userRelations = relations(usersTable, ({ one }) => ({
  drive: one(driveTable, {
    fields: [usersTable.id],
    references: [driveTable.id]
  })
}))

export const driveRelations = relations(driveTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [driveTable.ownerId],
    references: [usersTable.id]
  }),
  org: one(orgsTable, {
    fields: [driveTable.ownerId],
    references: [orgsTable.id]
  })
}))

export const orgRelations = relations(orgsTable, ({ one }) => ({
  drive: one(driveTable, {
    fields: [orgsTable.id],
    references: [driveTable.id]
  })
}))
