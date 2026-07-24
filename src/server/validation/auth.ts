import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(128),
  password: z.string().min(1).max(1024),
  next: z.string().max(2_048).optional(),
});
