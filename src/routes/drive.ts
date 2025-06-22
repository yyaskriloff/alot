import { Hono } from 'hono'
// import {
//   S3Client,
//   ListObjectsV2Command,
//   GetObjectCommand,
//   DeleteObjectCommand,
//   PutObjectCommand,
//   ListObjectVersionsCommand
// } from '@aws-sdk/client-s3'
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import db from '../db'
import { filesTable, foldersTable } from '../db/schema'
import { eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator as validator } from '@hono/zod-validator'
import { unionAll } from 'drizzle-orm/pg-core'

// on create, file confirmation then db
// on delete, db then file confirmation

// pointer to where the application is in the file system
const pointer = (nullable: 'nullable' | 'required') =>
  nullable === 'nullable'
    ? z.coerce
        .number()
        .optional()
        .transform(val => val ?? null)
    : z.coerce.number()

// Function to create S3Client for a specific bucket
// const s3Client = new S3Client({
//   region: 'us-east-1',
//   endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000', // MinIO server endpoint
//   forcePathStyle: true, // Required for MinIO compatibility
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
//   }
// })

// Default S3Client for backward compatibility

const driveRoute = new Hono()

// list files
driveRoute.get(
  '/ls',
  validator(
    'query',
    z.object({
      path: pointer('nullable'),
      sort: z.enum(['name', 'size', 'updated', 'created']).optional().default('name'),
      type: z.enum(['file', 'dir']).optional(),
      reverse: z.boolean().optional().default(false)
    })
  ),
  async c => {
    const { path, sort } = c.req.valid('query')
    // get all files and folders in the path in one select statement

    const files = db
      .select()
      .from(filesTable)
      .where(path ? eq(filesTable.parentFolder, path) : isNull(filesTable.parentFolder))

    const folders = db
      .select()
      .from(foldersTable)
      .where(path ? eq(foldersTable.parentId, path) : isNull(foldersTable.parentId))

    const filesAndFolders = Promise.all([files, folders]).then(([files, folders]) => {
      return [...files, ...folders].sort((a, b) => {
        switch (sort) {
          case 'name':
            return a.name.localeCompare(b.name)
          // case 'size':
          //   return a.size - b.size
          case 'updated':
            return a.updatedAt.getTime() - b.updatedAt.getTime()
          case 'created':
            return a.createdAt.getTime() - b.createdAt.getTime()
          default:
            return 0
        }
      })
    })

    return c.json(filesAndFolders)
  }
)

// create directory
driveRoute.post(
  '/mkdir',
  validator('json', z.object({ name: z.string().min(1).max(255) })),
  validator('query', z.object({ pointer: pointer('nullable') })),
  async c => {
    const { name } = c.req.valid('json')
    const { pointer } = c.req.valid('query')

    await db.insert(foldersTable).values({
      name,
      ownerId: 1,
      parentId: pointer
    })

    return c.body(null, 201)
  }
)

driveRoute.delete(
  '/rm',
  validator(
    'json',
    z.object({
      recursive: z.boolean().optional().default(false),
      version: z.coerce.number().optional(),
      file: z.coerce.number().optional()
    })
  ),
  validator('query', z.object({ pointer: pointer('nullable') })),
  async c => {
    const { recursive, version, file } = c.req.valid('json')
    const { pointer } = c.req.valid('query')

    if (!pointer) {
      return c.json({ error: 'pointer is required' }, 400)
    }

    if (file) {
      // check if its a version
      if (version) {
        //  delete version from s3
        return
      }

      await db.delete(filesTable).where(eq(filesTable.id, file))

      return c.body(null, 204)
    }

    // check if its empty
    const isEmpty = await unionAll(
      db.select({ id: filesTable.id }).from(filesTable).where(eq(filesTable.parentFolder, pointer)).limit(1),
      db.select({ id: foldersTable.id }).from(foldersTable).where(eq(foldersTable.parentId, pointer)).limit(1)
    ).then(r => r.length === 0)

    if (!isEmpty && !recursive) {
      return c.json({ error: 'Folder is not empty' }, 409)
    }

    if (recursive) {
      await db.execute(sql`
        WITH RECURSIVE subfolders AS (
          SELECT id FROM ${foldersTable} WHERE id = ${pointer}
          UNION ALL
          SELECT f.id
          FROM ${foldersTable} f
          JOIN subfolders sf ON f."parentId" = sf.id
        ),
        deleted_files AS (
          DELETE FROM ${filesTable}
          WHERE "parentFolder" IN (SELECT id FROM subfolders)
        )
        DELETE FROM ${foldersTable}
        WHERE id IN (SELECT id FROM subfolders)
      `)
    } else {
      await db.delete(foldersTable).where(eq(foldersTable.id, pointer))
    }

    return c.body(null, 204)
  }
)

driveRoute.post(
  '/touch',
  validator('json', z.object({ name: z.string().min(1).max(255) })),
  validator('query', z.object({ pointer: pointer('nullable') })),
  async c => {
    const { name } = c.req.valid('json')
    const { pointer } = c.req.valid('query')

    await db.insert(filesTable).values({
      name,
      type: 'mp3',
      key: crypto.randomUUID(),
      size: 0,
      parentFolder: pointer
    })
  }
)

driveRoute.get('/download', async c => {
  
})

driveRoute.get('/stat', async c => {})

driveRoute.get('/storage', async c => {
  // Here you would typically fetch storage usage from a database or storage
  const storageUsage = {
    total: 1000000, // Total storage in bytes
    used: 500000, // Used storage in bytes
    free: 500000 // Free storage in bytes
  }
  return c.json(storageUsage)
})

export default driveRoute
