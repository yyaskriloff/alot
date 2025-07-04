import { usersTable, orgsTable, drivesTable, subscriptionTable, foldersTable, filesTable } from './schema'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

// users
export const selectUserSchema = createSelectSchema(usersTable)
export const insertUserSchema = createInsertSchema(usersTable)
export const updateUserSchema = createUpdateSchema(usersTable)

// orgs
export const selectOrgSchema = createSelectSchema(orgsTable)
export const insertOrgSchema = createInsertSchema(orgsTable)
export const updateOrgSchema = createUpdateSchema(orgsTable)

// drives
export const selectDriveSchema = createSelectSchema(drivesTable)
export const insertDriveSchema = createInsertSchema(drivesTable)
export const updateDriveSchema = createUpdateSchema(drivesTable)

// subscriptions
export const selectSubscriptionSchema = createSelectSchema(subscriptionTable)
export const insertSubscriptionSchema = createInsertSchema(subscriptionTable)
export const updateSubscriptionSchema = createUpdateSchema(subscriptionTable)

// folders
export const selectFolderSchema = createSelectSchema(foldersTable)
export const insertFolderSchema = createInsertSchema(foldersTable)
export const updateFolderSchema = createUpdateSchema(foldersTable)

// files
export const selectFileSchema = createSelectSchema(filesTable)
export const insertFileSchema = createInsertSchema(filesTable)
export const updateFileSchema = createUpdateSchema(filesTable)
