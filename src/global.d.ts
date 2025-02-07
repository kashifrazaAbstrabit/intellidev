declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string;
      JWT_EXPIRE: string; // e.g., "7d" or "3600s"
      JWT_COOKIE_EXPIRE: string; // in days, e.g., "7"
      NODE_ENV: "development" | "production";
    }
  }
}
