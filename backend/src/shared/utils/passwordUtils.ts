import crypto from 'crypto';

/**
 * Hashes a password using crypto.scrypt
 * @param password - The plain text password to hash
 * @returns Promise<string> - Password hash in format "salt:derivedKey"
 * @throws Error if hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  const salt = crypto.randomBytes(16).toString('hex');

  return new Promise<string>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
      } else {
        resolve(`${salt}:${derivedKey.toString('hex')}`);
      }
    });
  });
}

/**
 * Verifies a plain text password against a stored hash
 * @param password - Plain text password to verify
 * @param hash - Stored hash in format "salt:derivedKey"
 * @returns Promise<boolean> - True if password matches, false otherwise
 * @throws Error if verification fails or hash format is invalid
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  if (!hash || !hash.includes(':')) {
    throw new Error('Invalid hash format');
  }

  const [salt, key] = hash.split(':');

  if (!salt || !key) {
    throw new Error('Invalid hash format - missing salt or key');
  }

  return new Promise<boolean>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
      } else {
        const expected = Buffer.from(key, 'hex');
        if (derivedKey.length !== expected.length) {
          resolve(false);
          return;
        }
        resolve(crypto.timingSafeEqual(derivedKey, expected));
      }
    });
  });
}
