import crypto from 'node:crypto';

const PASSWORD_SCRYPT_N = 16384;
const PASSWORD_SCRYPT_R = 8;
const PASSWORD_SCRYPT_P = 1;

export function hashPassword(password: string): string {
  if (typeof password !== 'string' || password.length < 1) throw new Error('Invalid password');
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 32, {
    N: PASSWORD_SCRYPT_N,
    r: PASSWORD_SCRYPT_R,
    p: PASSWORD_SCRYPT_P,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$${PASSWORD_SCRYPT_N}$${PASSWORD_SCRYPT_R}$${PASSWORD_SCRYPT_P}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export function verifyPassword(password: unknown, stored: string): { valid: boolean; needsUpgrade: boolean } {
  if (typeof password !== 'string' || typeof stored !== 'string') return { valid: false, needsUpgrade: false };

  const parts = stored.split('$');
  if (parts[0] === 'scrypt' && parts.length === 6) {
    const [, n, r, p, saltText, digestText] = parts;
    const nNum = Number(n);
    const rNum = Number(r);
    const pNum = Number(p);
    if (!Number.isSafeInteger(nNum) || !Number.isSafeInteger(rNum) || !Number.isSafeInteger(pNum) || nNum < PASSWORD_SCRYPT_N || rNum < PASSWORD_SCRYPT_R || pNum < PASSWORD_SCRYPT_P) {
      return { valid: false, needsUpgrade: false };
    }
    try {
      const salt = Buffer.from(saltText, 'base64url');
      const expected = Buffer.from(digestText, 'base64url');
      if (salt.length < 16 || expected.length !== 32) return { valid: false, needsUpgrade: false };
      const actual = crypto.scryptSync(password, salt, expected.length, {
        N: nNum,
        r: rNum,
        p: pNum,
        maxmem: 64 * 1024 * 1024,
      });
      return { valid: crypto.timingSafeEqual(expected, actual), needsUpgrade: false };
    } catch {
      return { valid: false, needsUpgrade: false };
    }
  }

  if (parts.length !== 2 || !parts[0] || !parts[1] || !/^[a-f0-9]{64}$/.test(parts[1])) {
    return { valid: false, needsUpgrade: false };
  }
  const legacyDigest = crypto.createHash('sha256').update(parts[0] + ':' + password).digest('hex');
  return {
    valid: crypto.timingSafeEqual(Buffer.from(legacyDigest), Buffer.from(parts[1])),
    needsUpgrade: true,
  };
}
