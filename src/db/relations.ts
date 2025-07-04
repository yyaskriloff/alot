import { relations } from 'drizzle-orm'
import { usersTable, orgsTable, drivesTable } from './schema'

export const userRelations = relations(usersTable, ({ one }) => ({
  drive: one(drivesTable, {
    fields: [usersTable.id],
    references: [drivesTable.id]
  })
}))

export const driveRelations = relations(drivesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [drivesTable.ownerId],
    references: [usersTable.id]
  }),
  org: one(orgsTable, {
    fields: [drivesTable.ownerId],
    references: [orgsTable.id]
  })
}))

export const orgRelations = relations(orgsTable, ({ one }) => ({
  drive: one(drivesTable, {
    fields: [orgsTable.id],
    references: [drivesTable.id]
  })
}))
