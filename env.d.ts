declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    PORT?: string;
    KINDE_CLIENT_ID: string;
    KINDE_ISSUER_BASE_URL: string;
    KINDE_SITE_URL: string;
    KINDE_SECRET: string;
    KINDE_REDIRECT_URL: string;
    // Add other variables as needed
  }
}
