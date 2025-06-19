import { Hono } from 'hono'
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  ListObjectVersionsCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Function to create S3Client for a specific bucket
const createS3Client = (bucketName?: string) => {
  return new S3Client({
    region: 'us-east-1',
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000', // MinIO server endpoint
    forcePathStyle: true, // Required for MinIO compatibility
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
  })
}

// Default S3Client for backward compatibility
const s3Client = createS3Client()

const driveRoute = new Hono()

// list files
driveRoute.get('/files', async c => {
  //  q path optional
  const bucket = c.req.query('bucket') || process.env.AWS_BUCKET_NAME!
  const client = createS3Client(bucket)

  const files = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: c.req.query('path') || ''
    })
  )
  return c.json(files)
})
// upload files
driveRoute.post('/files', async c => {
  const bucket = c.req.query('bucket') || process.env.AWS_BUCKET_NAME!
  const client = createS3Client(bucket)
  // Implementation here
})
// download files
driveRoute.get('/files/:id', async c => {
  const bucket = c.req.query('bucket') || process.env.AWS_BUCKET_NAME!
  const client = createS3Client(bucket)
  // redirect to presigned url
})
// delete files
driveRoute.delete('/files/:id', async c => {
  const bucket = c.req.query('bucket') || process.env.AWS_BUCKET_NAME!
  const client = createS3Client(bucket)
  // list versions
  // delete all vesions
})
// get file metadata
driveRoute.get('/files/:id/metadata', async c => {
  const bucket = c.req.query('bucket') || process.env.AWS_BUCKET_NAME!
  const client = createS3Client(bucket)
  // get metafara from db
})
// get directory listing
driveRoute.get('/directory', async c => {
  const bucket = c.req.query('bucket') || process.env.AWS_BUCKET_NAME!
  const client = createS3Client(bucket)
})
// create directory
driveRoute.post('/directory', async c => {
  const bucket = c.req.query('bucket') || process.env.AWS_BUCKET_NAME!
  const client = createS3Client(bucket)
})

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
