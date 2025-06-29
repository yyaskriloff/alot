import { Hono } from 'hono'
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  ListObjectVersionsCommand,
  GetObjectAttributesCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import db from '../db'
import { filesTable, foldersTable } from '../db/schema'
import { eq, isNull, sql, count, sum, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator as validator } from '@hono/zod-validator'
import { unionAll } from 'drizzle-orm/pg-core'
import mime from 'mime-types'
import { v4 as uuid } from 'uuid'

// on create, file confirmation then db
// on delete, db then file confirmation

const fileType = z.enum([
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/aac',
  'audio/m4a',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/tiff',
  'image/heic',
  'image/heif',
  'image/heif-sequence',
  'image/heic-sequence'
])
// pointer to where the application is in the file system
const cwd = (nullable: 'nullable' | 'required') =>
  nullable === 'nullable'
    ? z
        .string()
        .optional()
        .transform(val => val ?? null)
    : z.string()

const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000', // MinIO server endpoint
  forcePathStyle: true, // Required for MinIO compatibility
  credentials: {
    accessKeyId: 'admin',
    secretAccessKey: 'password123'
  }
})

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

    const [newFolder] = await db
      .insert(foldersTable)
      .values({
        name,
        ownerId: 1,
        parentId: cwd
      })
      .returning()

    return c.json({ id: newFolder.id }, 201)
  }
)

driveRoute.delete(
  '/rm',
  validator(
    'json',
    z.object({
      version: z.coerce.number().optional(),
      file: z.string().optional()
    })
  ),
  validator('query', z.object({ cwd: cwd('nullable') })),
  async c => {
    const { version, file } = c.req.valid('json')
    const { cwd } = c.req.valid('query')

    if (file) {
      await db
        .update(filesTable)
        .set({
          trash: true
        })
        .where(eq(filesTable.id, file))
        .returning()

      return c.body(null, 204)
    }
    if (!cwd) {
      return c.json({ error: 'pointer is required' }, 400)
    }

    if (!cwd) {
      return c.json({ error: 'cwd is required' }, 400)
    }

    await db.update(foldersTable).set({ trash: true }).where(eq(foldersTable.id, cwd))

    return c.body(null, 204)
  }
)

// touch would have to change
driveRoute.get(
  '/touch',
  validator(
    'query',
    z.object({
      size: z.coerce.number(),
      cwd: cwd('nullable'),
      type: fileType
    })
  ),
  async c => {
    const { type, cwd, size } = c.req.valid('query')

    const extension = mime.extension(type)

    if (!extension) {
      return c.json({ error: 'Invalid file type' }, 400)
    }

    const id = uuid()

    // generate a signed url for the file
    const signedUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: 'test',
        Key: cwd ? `1/${cwd}/${id}.${extension}` : `1/${id}.${extension}`,
        ContentLength: size
      }),
      {
        expiresIn: 60 * 5
      }
    )

    return c.json({
      key: `${id}.${extension}`,
      signedUrl
    })
  }
)

driveRoute.post(
  '/touch',
  validator(
    'json',
    z.object({
      name: z.string().min(1).max(255),
      key: z.string().min(1).max(255),
      type: fileType,
      size: z.coerce.number()
    })
  ),
  validator('query', z.object({ cwd: cwd('nullable') })),
  async c => {
    const { name, key, type, size } = c.req.valid('json')
    const { cwd } = c.req.valid('query')

    // validate file is in the s3 bucket
    const { ObjectSize: fileSize } = await s3Client.send(
      new GetObjectAttributesCommand({
        Bucket: 'test',
        Key: cwd ? `1/${cwd}/${key}` : `1/${key}`,
        ObjectAttributes: ['ObjectSize']
      })
    )

    if (fileSize !== size) {
      return c.json({ error: 'File size does not match' }, 400)
    }

    const [newFile] = await db
      .insert(filesTable)
      .values({
        id: key.split('.')[0],
        name,
        type,
        size: fileSize,
        parentFolder: cwd,
        ownerId: 1
      })
      .returning()

    return c.json({ id: newFile.id }, 201)
  }
)

driveRoute.get(
  '/download',
  validator(
    'query',
    z.object({
      file: z.string().optional()
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
      file: z.string(),
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

driveRoute.get('/trash', async c => {
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
      .where(eq(filesTable.trash, true)),
    db
      .select({
        id: foldersTable.id,
        name: foldersTable.name,
        type: sql<string>`'folder'`,
        size: sql<number>`0`,
        modified: foldersTable.updatedAt
      })
      .from(foldersTable)
      .where(eq(filesTable.trash, true))
  )

  return c.json(filesAndFolders)
})

driveRoute.delete(
  '/trash',
  validator(
    'json',
    z.object({
      file: z.string().optional(),
      folder: z.string().optional()
    })
  ),
  async c => {
    const { file, folder } = c.req.valid('json')

    if (file && folder) {
      return c.json({ error: 'Must provide either file or folder' }, 400)
    }

    if (file) {
      await db.update(filesTable).set({ trash: false, delete: new Date() }).where(eq(filesTable.id, file))
    }

    if (folder) {
      await db.update(foldersTable).set({ trash: false, delete: new Date() }).where(eq(foldersTable.id, folder))
      await db.update(filesTable).set({ trash: false, delete: new Date() }).where(eq(filesTable.parentFolder, folder))
    }

    const foldersInTrash = await db
      .update(foldersTable)
      .set({ trash: false, delete: new Date() })
      .returning()
      .then(folders => folders.map(folder => folder.id))

    await db
      .update(filesTable)
      .set({ trash: false, delete: new Date() })
      .where(inArray(filesTable.parentFolder, foldersInTrash))

    await db.update(filesTable).set({ trash: false, delete: new Date() }).where(eq(filesTable.trash, true))

    return c.json({ success: true })
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
