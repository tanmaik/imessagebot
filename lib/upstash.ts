import { Redis } from "@upstash/redis";
import { Client } from "@upstash/qstash";

// Only initialize if env vars are present (production)
// This prevents build errors in dev/preview environments
export const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  : (null as unknown as Redis);

export const qstash = process.env.QSTASH_TOKEN
  ? new Client({
    token: process.env.QSTASH_TOKEN,
  })
  : (null as unknown as Client);

