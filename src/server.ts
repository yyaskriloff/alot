import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { PostHog } from 'posthog-node'
import db, { directoriesTable, filesTable } from './db'
import { and, eq, isNull } from 'drizzle-orm'

const client = new PostHog('phc_kyRsR2QdYkqhrEldJKhnZbFe1Rrxk6pIn7kLDAkS8Bv', {
  host: 'https://us.i.posthog.com'
})

const app = new Hono()

app.get('/', c => {
  return c.text('Hello Hono!')
})

// list files
app.get('/drive/files', async c => {
  //  q path optional
  const path = c.req.query('path')

  const files = await db
    .select()
    .from(directoriesTable)
    .innerJoin(filesTable, eq(directoriesTable.id, filesTable.directoryId))
    .where(and(eq(directoriesTable.ownerId, 1), path ? eq(directoriesTable.path, path) : isNull(directoriesTable.path)))

  return c.json(files)
})
// upload files

app.post('/drive/files', async c => {
  // Here you would typically handle file uploads
})
// download files
app.get('/drive/files/:id/download', async c => {
  const fileId = c.req.param('id')
  // redirect to presigned URL or handle download logic
  // Here you would typically fetch the file from storage and return it
  return c.text(`Downloading file with ID: ${fileId}`)
})
// delete files
app.delete('/drive/files/:id', async c => {
  const fileId = c.req.param('id')
  // Here you would typically delete the file from storage
  return c.text(`Deleted file with ID: ${fileId}`)
})
// get file metadata
app.get('/drive/files/:id/metadata', async c => {
  const fileId = c.req.param('id')
  // Here you would typically fetch the file metadata from a database or storage
  const metadata = { id: fileId, name: `file${fileId}.txt`, size: 1234 }
  return c.json(metadata)
})
// get directory listing
app.get('/drive/directory', async c => {
  // Here you would typically fetch the directory listing from a database or storage
  const directory = [
    { id: 1, name: 'folder1', type: 'folder' },
    { id: 2, name: 'file1.txt', type: 'file' }
  ]
  return c.json(directory)
})
// create directory
app.post('/drive/directory', async c => {
  const { name } = await c.req.json()
  // Here you would typically create a directory in the database or storage
  return c.text(`Created directory: ${name}`)
})

app.get('/drive/storage', async c => {
  // Here you would typically fetch storage usage from a database or storage
  const storageUsage = {
    total: 1000000, // Total storage in bytes
    used: 500000, // Used storage in bytes
    free: 500000 // Free storage in bytes
  }
  return c.json(storageUsage)
})

serve(
  {
    fetch: app.fetch,
    port: 3000
  },
  info => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)
