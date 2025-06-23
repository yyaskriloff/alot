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
import { eq, isNull, sql, count, sum } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator as validator } from '@hono/zod-validator'
import { unionAll } from 'drizzle-orm/pg-core'

// on create, file confirmation then db
// on delete, db then file confirmation

// pointer to where the application is in the file system
const cwd = (nullable: 'nullable' | 'required') =>
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
      cwd: cwd('nullable'),
      sort: z.enum(['name', 'size', 'updated', 'created']).optional().default('name'),
      type: z.enum(['file', 'dir']).optional(),
      reverse: z.boolean().optional().default(false)
    })
  ),
  async c => {
    const { cwd, sort } = c.req.valid('query')
    // get all files and folders in the path in one select statement

    const filesAndFolders = await unionAll(
      db
        .select({
          id: filesTable.id,
          name: filesTable.name,
          type: filesTable.type,
          size: filesTable.size,
          modified: filesTable.updatedAt
        })
        .from(filesTable)
        .where(cwd ? eq(filesTable.parentFolder, cwd) : isNull(filesTable.parentFolder)),
      db
        .select({
          id: foldersTable.id,
          name: foldersTable.name,
          type: sql<string>`'folder'`,
          size: sql<number>`0`,
          modified: foldersTable.updatedAt
        })
        .from(foldersTable)
        .where(cwd ? eq(foldersTable.parentId, cwd) : isNull(foldersTable.parentId))
    )

    return c.json(filesAndFolders)
  }
)

// create directory
driveRoute.post(
  '/mkdir',
  validator('json', z.object({ name: z.string().min(1).max(255) })),
  validator('query', z.object({ cwd: cwd('nullable') })),
  async c => {
    const { name } = c.req.valid('json')
    const { cwd } = c.req.valid('query')

    await db.insert(foldersTable).values({
      name,
      ownerId: 1,
      parentId: cwd
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
  validator('query', z.object({ cwd: cwd('nullable') })),
  async c => {
    const { recursive, version, file } = c.req.valid('json')
    const { cwd } = c.req.valid('query')

    if (file) {
      // check if its a version
      if (version) {
        //  delete version from s3
        return
      }

      await db.delete(filesTable).where(eq(filesTable.id, file))

      return c.body(null, 204)
    }
    if (!cwd) {
      return c.json({ error: 'pointer is required' }, 400)
    }

    // check if its empty
    const isEmpty = await unionAll(
      db.select({ id: filesTable.id }).from(filesTable).where(eq(filesTable.parentFolder, cwd)).limit(1),
      db.select({ id: foldersTable.id }).from(foldersTable).where(eq(foldersTable.parentId, cwd)).limit(1)
    ).then(r => r.length === 0)

    if (!isEmpty && !recursive) {
      return c.json({ error: 'Folder is not empty' }, 409)
    }

    if (recursive) {
      await db.execute(sql`
        WITH RECURSIVE subfolders AS (
          SELECT id FROM ${foldersTable} WHERE id = ${cwd}
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
      await db.delete(foldersTable).where(eq(foldersTable.id, cwd))
    }

    return c.body(null, 204)
  }
)

driveRoute.post(
  '/touch',
  validator('json', z.object({ name: z.string().min(1).max(255) })),
  validator('query', z.object({ cwd: cwd('nullable') })),
  async c => {
    const { name } = c.req.valid('json')
    const { cwd } = c.req.valid('query')

    await db.insert(filesTable).values({
      name,
      type: 'mp3',
      key: crypto.randomUUID(),
      size: 0,
      parentFolder: cwd,
      ownerId: 1
    })

    return c.body(null, 201)
  }
)

driveRoute.get(
  '/download',
  validator(
    'query',
    z.object({
      file: z.coerce.number().optional()
    })
  ),
  async c => {
    //  redirect to the filed
  }
)

driveRoute.get(
  '/stat',
  validator(
    'query',
    z.object({
      file: z.coerce.number(),
      cwd: cwd('nullable')
    })
  ),
  async c => {
    const { file, cwd } = c.req.valid('query')

    if (file) {
      const fileStats = await db
        .select({
          size: filesTable.size,
          type: filesTable.type
        })
        .from(filesTable)
        .where(eq(filesTable.id, file))

      return c.json(fileStats)
    }
    const folderStats = await db
      .select({
        files: count(filesTable.id),
        size: sum(filesTable.size)
      })
      .from(filesTable)
      .innerJoin(foldersTable, cwd ? eq(filesTable.parentFolder, foldersTable.id) : isNull(filesTable.parentFolder))
      .where(cwd ? eq(foldersTable.id, cwd) : isNull(foldersTable.id))

    return c.json(folderStats)
  }
)

driveRoute.get('/storage', async c => {
  // Here you would typically fetch storage usage from a database or storage

  const usedStorage = await db
    .select({
      used: sum(filesTable.size)
    })
    .from(filesTable)
    .where(eq(filesTable.ownerId, 1))
    .then(([{ used }]) => {
      return parseInt(used || '0')
    })
  // Calculate total storage in 10GB increments, starting at 10GB
  const totalStorage = Math.ceil((usedStorage || 1) / 10000000000) * 10000000000

  return c.json({
    total: totalStorage, // Total storage in bytes
    used: usedStorage, // Used storage in bytes
    free: totalStorage - usedStorage
  })
})

export default driveRoute
