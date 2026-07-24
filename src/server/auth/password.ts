import argon2 from 'argon2';
import { createHash, timingSafeEqual } from 'node:crypto';

export interface AdminCredentialConfig {
  username: string;
  passwordHash: string;
}

export function hashPassword(password: string) {
  return argon2.hash(password, { type: argon2.argon2id });
}

function hashUsername(username: string) {
  return createHash('sha256').update(username).digest();
}

export async function verifyAdminCredentials(
  username: string,
  password: string,
  config: AdminCredentialConfig,
): Promise<boolean> {
  const sameUsername = timingSafeEqual(hashUsername(username), hashUsername(config.username));

  try {
    const passwordMatches = await argon2.verify(config.passwordHash, password);
    return sameUsername && passwordMatches;
  } catch {
    return false;
  }
}
