import IORedis from 'ioredis';

function getBaseRedisConfig() {
  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD ?? undefined,
  };
}

/**
 * Plain connection config — pass this to BullMQ Queue / Worker to avoid the
 * duplicate-ioredis type conflict (BullMQ bundles its own ioredis internally).
 */
export function getBullMQConnectionOptions() {
  return {
    ...getBaseRedisConfig(),
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
    redisClient = new IORedis(getBaseRedisConfig());
  }
  return redisClient;
}

let subscriberClient: IORedis | null = null;

/**
 * Dedicated IORedis client for pub/sub subscriptions.
 * ioredis transitions a connection into subscriber mode on the first subscribe()
 * call, after which it cannot issue regular commands — hence the separate instance.
 */
export function getSubscriberClient(): IORedis {
  if (!subscriberClient) {
    subscriberClient = new IORedis(getBaseRedisConfig());
  }
  return subscriberClient;
}
