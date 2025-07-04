import {
  selectUserSchema,
  selectOrgSchema,
  selectDriveSchema,
  selectSubscriptionSchema,
  selectFolderSchema,
  selectFileSchema
} from './validaors'
import { z } from 'zod/v4'

export type DbUser = z.infer<typeof selectUserSchema>
export type DbOrg = z.infer<typeof selectOrgSchema>
export type DbDrive = z.infer<typeof selectDriveSchema>
export type DbSubscription = z.infer<typeof selectSubscriptionSchema>
export type DbFolder = z.infer<typeof selectFolderSchema>
export type File = z.infer<typeof selectFileSchema>
