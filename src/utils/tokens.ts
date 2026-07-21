import { randomBytes, createHash } from 'crypto';

// High-entropy random tokens (unlike passwords) don't need slow hashing —
// SHA-256 is enough to make a DB dump alone useless for reconstructing the
// raw token that goes out over email/API, while lookups stay a plain
// indexed equality check.
export const generateToken = (): string => randomBytes(32).toString('hex');

export const hashToken = (rawToken: string): string =>
    createHash('sha256').update(rawToken).digest('hex');
