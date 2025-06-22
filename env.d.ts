declare namespace NodeJS {
  interface ProcessEnv {
    // Auth (Kinde)
    KINDE_CLIENT_ID: string
    KINDE_ISSUER_BASE_URL: string
    KINDE_SITE_URL: string
    KINDE_SECRET: string
    KINDE_REDIRECT_URL: string

    // Database
    DATABASE_URL: string

    // Storage (e.g. S3, R2, etc)
    STORAGE_ACCESS_KEY_ID: string
    STORAGE_SECRET_ACCESS_KEY: string
    STORAGE_BUCKET: string
    STORAGE_REGION?: string
  }
}
