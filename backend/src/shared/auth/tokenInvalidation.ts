import { getRedisClient, getSubscriberClient } from '../redis/redis-client';

export const REDIS_KEY_PREFIX = 'token:invalidated:';

const NODE_IDENTIFIER = process.env.NODE_IDENTIFIER ?? 'server-1';
const TOTAL_NODES = Number(process.env.TOTAL_NODES ?? '1');
const INVALIDATION_CHANNEL_PREFIX = 'token-invalidation:';

interface InvalidationMessage {
  userId: string;
  iat: number;
}

/**
 * In-memory map: userId → Unix seconds timestamp.
 * Any JWT whose iat < this value is considered invalidated.
 */
export const invalidationMap = new Map<string, number>();

/**
 * Load all existing invalidation timestamps from Redis into the in-memory map.
 * Call this once on application startup.
 */
export async function loadInvalidationMapFromRedis(): Promise<void> {
  const client = getRedisClient();
  const keys = await client.keys(`${REDIS_KEY_PREFIX}*`);
  if (keys.length === 0) return;

  const values = await client.mget(...keys);
  for (let i = 0; i < keys.length; i++) {
    const userId = keys[i].slice(REDIS_KEY_PREFIX.length);
    const raw = values[i];
    if (raw !== null) {
      invalidationMap.set(userId, Number(raw));
    }
  }
}

async function publishInvalidation(userId: string, iat: number): Promise<void> {
  if (TOTAL_NODES <= 1) return;
  const selfIndex = Number(NODE_IDENTIFIER.split('-')[1]);
  const message = JSON.stringify({ userId, iat } satisfies InvalidationMessage);
  const client = getRedisClient();
  const publishes: Promise<number>[] = [];
  for (let i = 1; i <= TOTAL_NODES; i++) {
    if (i === selfIndex) continue;
    publishes.push(client.publish(`${INVALIDATION_CHANNEL_PREFIX}server-${i}`, message));
  }
  await Promise.all(publishes);
}

/**
 * Invalidate all tokens issued before now for a given user.
 * Persists to Redis, updates the in-memory map, and fans out a pub/sub
 * message to all other nodes so they can update their own in-memory maps.
 */
export async function invalidateUser(userId: string): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000);
  const client = getRedisClient();
  await client.set(`${REDIS_KEY_PREFIX}${userId}`, String(timestamp));
  invalidationMap.set(userId, timestamp);
  await publishInvalidation(userId, timestamp);
}

/**
 * Subscribe to this node's invalidation channel and update the in-memory map
 * when another node publishes an invalidation event.
 * Call this once on application startup after loadInvalidationMapFromRedis().
 */
export function startInvalidationSubscriber(): void {
  if (TOTAL_NODES <= 1) return;
  const channel = `${INVALIDATION_CHANNEL_PREFIX}${NODE_IDENTIFIER}`;
  const subscriber = getSubscriberClient();
  subscriber.subscribe(channel, (err) => {
    if (err) {
      console.error(`[tokenInvalidation] Failed to subscribe to channel "${channel}":`, err);
    } else {
      console.log(`[tokenInvalidation] Subscribed to invalidation channel "${channel}"`);
    }
  });
  subscriber.on('message', (receivedChannel, rawMessage) => {
    if (receivedChannel !== channel) return;
    try {
      const { userId, iat } = JSON.parse(rawMessage) as InvalidationMessage;
      invalidationMap.set(userId, iat);
    } catch (err) {
      console.error('[tokenInvalidation] Failed to parse invalidation message:', err);
    }
  });
}

/**
 * Returns true if the JWT (identified by iat) should be rejected.
 */
export function isTokenInvalidated(userId: string, iat: number): boolean {
  const invalidatedBefore = invalidationMap.get(userId) ?? 0;
  return iat <= invalidatedBefore;
}
