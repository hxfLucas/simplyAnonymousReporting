import IORedis from 'ioredis';

/**
 * Plain connection config — pass this to BullMQ Queue / Worker to avoid the
 * duplicate-ioredis type conflict (BullMQ bundles its own ioredis internally).
 */
export function getBullMQConnectionOptions() {
  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD ?? undefined,
    maxRetriesPerRequest: null as null, // required by BullMQ
  };
}

let redisClient: IORedis | null = null;

/**
 * Singleton IORedis client for direct Redis calls (e.g. GET/SET for dedup TTL).
 * Do NOT pass this to BullMQ — use getBullMQConnectionOptions() instead.
 */
export function getRedisClient(): IORedis {
  if (!redisClient) {
    redisClient = new IORedis(getBullMQConnectionOptions());
  }
  return redisClient;
}
