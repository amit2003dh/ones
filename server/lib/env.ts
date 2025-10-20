// Centralized environment loader and typed access for server libs
// Loads .env in non-production environments and exports known variables.
import path from "path";

if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  // Load .env from project root if present
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dotenv = require("dotenv");
    const envPath = path.resolve(process.cwd(), ".env");
    dotenv.config({ path: envPath });
  } catch (e) {
    // ignore if dotenv isn't installed or fails
  }
}
export const ENV = {
  PORT: process.env.PORT || "5000",
  DATABASE_URL: process.env.DATABASE_URL || "",
  GMAIL_EMAIL: process.env.GMAIL_EMAIL || "",
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL || "",
  QDRANT_URL: process.env.QDRANT_URL || "",
  QDRANT_API_KEY: process.env.QDRANT_API_KEY || "",
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || "",
  SLACK_API_TOKEN: process.env.SLACK_API_TOKEN || "",
  WEBHOOK_SITE_URL: process.env.WEBHOOK_SITE_URL || "",
  REPL_ID: process.env.REPL_ID || "",
};

export type EnvType = typeof ENV;

export default ENV;
