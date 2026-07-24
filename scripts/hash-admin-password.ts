import { hashPassword } from '../src/server/auth/password';

const password = process.argv.length === 3 ? process.argv[2] : undefined;

if (!password || password.length < 12) {
  console.error('Password must be provided as one argument and contain at least 12 characters.');
  process.exitCode = 1;
} else {
  process.stdout.write(`${await hashPassword(password)}\n`);
}
