import { getRedisClient } from '../../redis/redis-client';
import {
  isTokenInvalidated,
  invalidateUser,
  loadInvalidationMapFromRedis,
  invalidationMap,
  REDIS_KEY_PREFIX,
} from '../tokenInvalidation';

jest.mock('../../redis/redis-client', () => ({
  getRedisClient: jest.fn(),
}));

const mockRedis = {
  keys: jest.fn(),
  mget: jest.fn(),
  set: jest.fn(),
};

beforeEach(() => {
  invalidationMap.clear();
  jest.clearAllMocks();
  (getRedisClient as jest.Mock).mockReturnValue(mockRedis);
});

describe('isTokenInvalidated', () => {
  it('returns false when the user is not in the invalidation map', () => {
    expect(isTokenInvalidated('unknown-user', 9999)).toBe(false);
  });

  it('returns true when iat is less than the invalidation timestamp', () => {
    invalidationMap.set('user-1', 1000);
    expect(isTokenInvalidated('user-1', 999)).toBe(true);
  });

  it('returns false when iat is greater than the invalidation timestamp', () => {
    invalidationMap.set('user-1', 1000);
    expect(isTokenInvalidated('user-1', 1001)).toBe(false);
  });

  it('returns true on the boundary (iat === invalidation timestamp)', () => {
    invalidationMap.set('user-1', 1000);
    expect(isTokenInvalidated('user-1', 1000)).toBe(true);
  });
});

describe('invalidateUser', () => {
  it('calls client.set with the correct Redis key and timestamp string', async () => {
    mockRedis.set.mockResolvedValue('OK');

    const userId = 'user-to-invalidate';
    const before = Math.floor(Date.now() / 1000);
    await invalidateUser(userId);
    const after = Math.floor(Date.now() / 1000);

    expect(mockRedis.set).toHaveBeenCalledTimes(1);

    const [key, value] = mockRedis.set.mock.calls[0] as [string, string];
    expect(key).toBe(`${REDIS_KEY_PREFIX}${userId}`);

    const timestamp = Number(value);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('updates the invalidationMap with the correct timestamp', async () => {
    mockRedis.set.mockResolvedValue('OK');

    const userId = 'user-map-update';
    const before = Math.floor(Date.now() / 1000);
    await invalidateUser(userId);
    const after = Math.floor(Date.now() / 1000);

    const stored = invalidationMap.get(userId)!;
    expect(stored).toBeGreaterThanOrEqual(before);
    expect(stored).toBeLessThanOrEqual(after);
  });

  it('uses Math.floor(Date.now() / 1000) for the timestamp (second precision)', async () => {
    mockRedis.set.mockResolvedValue('OK');
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_123);

    await invalidateUser('user-precise');

    const [, value] = mockRedis.set.mock.calls[0] as [string, string];
    expect(Number(value)).toBe(1_700_000_000); // floor of ms / 1000
    expect(invalidationMap.get('user-precise')).toBe(1_700_000_000);

    dateSpy.mockRestore();
  });
});

describe('loadInvalidationMapFromRedis', () => {
  it('does nothing when keys returns an empty array', async () => {
    mockRedis.keys.mockResolvedValue([]);

    await loadInvalidationMapFromRedis();

    expect(mockRedis.mget).not.toHaveBeenCalled();
    expect(invalidationMap.size).toBe(0);
  });

  it('populates invalidationMap with data from Redis', async () => {
    const keys = [
      `${REDIS_KEY_PREFIX}user-a`,
      `${REDIS_KEY_PREFIX}user-b`,
    ];
    mockRedis.keys.mockResolvedValue(keys);
    mockRedis.mget.mockResolvedValue(['1111', '2222']);

    await loadInvalidationMapFromRedis();

    expect(invalidationMap.get('user-a')).toBe(1111);
    expect(invalidationMap.get('user-b')).toBe(2222);
  });

  it('ignores entries where the mget value is null', async () => {
    const keys = [
      `${REDIS_KEY_PREFIX}user-null`,
      `${REDIS_KEY_PREFIX}user-ok`,
    ];
    mockRedis.keys.mockResolvedValue(keys);
    mockRedis.mget.mockResolvedValue([null, '999']);

    await loadInvalidationMapFromRedis();

    expect(invalidationMap.has('user-null')).toBe(false);
    expect(invalidationMap.get('user-ok')).toBe(999);
  });

  it('passes all Redis keys to mget', async () => {
    const keys = [`${REDIS_KEY_PREFIX}u1`, `${REDIS_KEY_PREFIX}u2`];
    mockRedis.keys.mockResolvedValue(keys);
    mockRedis.mget.mockResolvedValue(['10', '20']);

    await loadInvalidationMapFromRedis();

    expect(mockRedis.mget).toHaveBeenCalledWith(...keys);
  });
});
