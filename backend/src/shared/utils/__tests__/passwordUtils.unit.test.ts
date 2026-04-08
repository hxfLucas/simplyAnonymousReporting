import { hashPassword, verifyPassword } from '../passwordUtils';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('generates a hash with salt and key separated by colon', async () => {
      const hash = await hashPassword('TestPassword123!');
      expect(hash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{128}$/);
    });

    it('generates different hashes for the same password', async () => {
      const password = 'SamePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('creates a 32-character hex salt', async () => {
      const hash = await hashPassword('TestPassword123!');
      const salt = hash.split(':')[0];
      expect(salt).toMatch(/^[a-f0-9]{32}$/);
      expect(salt.length).toBe(32);
    });

    it('creates a 128-character hex key', async () => {
      const hash = await hashPassword('TestPassword123!');
      const key = hash.split(':')[1];
      expect(key).toMatch(/^[a-f0-9]{128}$/);
      expect(key.length).toBe(128);
    });

    it('rejects empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password must be a non-empty string');
    });

    it('rejects null password', async () => {
      await expect(hashPassword(null as any)).rejects.toThrow('Password must be a non-empty string');
    });

    it('rejects undefined password', async () => {
      await expect(hashPassword(undefined as any)).rejects.toThrow('Password must be a non-empty string');
    });

    it('rejects non-string password', async () => {
      await expect(hashPassword(123 as any)).rejects.toThrow('Password must be a non-empty string');
    });
  });

  describe('verifyPassword', () => {
    it('returns true when password matches hash', async () => {
      const password = 'CorrectPassword123!';
      const hash = await hashPassword(password);
      const matches = await verifyPassword(password, hash);
      expect(matches).toBe(true);
    });

    it('returns false when password does not match hash', async () => {
      const hash = await hashPassword('CorrectPassword123!');
      const matches = await verifyPassword('WrongPassword123!', hash);
      expect(matches).toBe(false);
    });

    it('is case-sensitive', async () => {
      const hash = await hashPassword('TestPassword123!');
      const lowerResult = await verifyPassword('testpassword123!', hash);
      expect(lowerResult).toBe(false);
    });

    it('is whitespace-sensitive', async () => {
      const hash = await hashPassword('TestPassword123!');
      const withSpace = await verifyPassword('TestPassword123! ', hash);
      expect(withSpace).toBe(false);
    });

    it('rejects empty password', async () => {
      const hash = await hashPassword('SomePassword123!');
      await expect(verifyPassword('', hash)).rejects.toThrow('Password must be a non-empty string');
    });

    it('rejects null password', async () => {
      const hash = await hashPassword('SomePassword123!');
      await expect(verifyPassword(null as any, hash)).rejects.toThrow('Password must be a non-empty string');
    });

    it('rejects invalid hash format (no colon)', async () => {
      await expect(verifyPassword('Password123!', 'invalidhash')).rejects.toThrow('Invalid hash format');
    });

    it('rejects hash with missing salt', async () => {
      await expect(verifyPassword('Password123!', ':abc')).rejects.toThrow('Invalid hash format');
    });

    it('rejects hash with missing key', async () => {
      await expect(verifyPassword('Password123!', 'abc:')).rejects.toThrow('Invalid hash format');
    });
  });
});

