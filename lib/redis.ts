import { Redis } from "@upstash/redis";

let cachedRedis: Redis | null = null;

export function getRedis() {
  if (cachedRedis) {
    return cachedRedis;
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl) {
    throw new Error("Missing environment variable: UPSTASH_REDIS_REST_URL");
  }

  if (!redisToken) {
    throw new Error("Missing environment variable: UPSTASH_REDIS_REST_TOKEN");
  }

  cachedRedis = new Redis({
    url: redisUrl,
    token: redisToken,
  });

  return cachedRedis;
}
