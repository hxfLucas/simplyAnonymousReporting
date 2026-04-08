export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  // Simple, permissive email regex
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export default isValidEmail;
