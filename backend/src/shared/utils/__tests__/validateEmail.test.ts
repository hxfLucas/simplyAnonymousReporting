import { isValidEmail } from '../validateEmail';

describe('isValidEmail', () => {
  describe('Valid emails', () => {
    it('accepts simple valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('accepts emails with numbers', () => {
      expect(isValidEmail('user123@example.com')).toBe(true);
    });

    it('accepts emails with dots in local part', () => {
      expect(isValidEmail('user.name@example.com')).toBe(true);
    });

    it('accepts emails with hyphens', () => {
      expect(isValidEmail('user-name@example.co.uk')).toBe(true);
    });

    it('accepts emails with uppercase letters', () => {
      expect(isValidEmail('User@Example.COM')).toBe(true);
    });

    it('accepts emails with multiple subdomains', () => {
      expect(isValidEmail('user@subdomain.example.co.uk')).toBe(true);
    });
  });

  describe('Invalid emails', () => {
    it('rejects emails without @', () => {
      expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('rejects emails without domain', () => {
      expect(isValidEmail('user@')).toBe(false);
    });

    it('rejects emails without local part', () => {
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('rejects emails without TLD', () => {
      expect(isValidEmail('user@example')).toBe(false);
    });

    it('rejects emails with spaces', () => {
      expect(isValidEmail('user name@example.com')).toBe(false);
    });

    it('rejects emails with @ in local part', () => {
      expect(isValidEmail('user@name@example.com')).toBe(false);
    });

    it('rejects null', () => {
      expect(isValidEmail(null as any)).toBe(false);
    });

    it('rejects undefined', () => {
      expect(isValidEmail(undefined as any)).toBe(false);
    });

    it('rejects empty strings', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('rejects non-string values', () => {
      expect(isValidEmail(123 as any)).toBe(false);
    });
  });
});
