import { z } from 'zod';

export const userSchema = z.object({
  email: z.string({ required_error: 'Email Required' }).email({ message: 'Invalid email' }),
  password: z.string({ required_error: 'Password Required' }).min(6, { message: 'Password must be at least 6 characters' }),
  role: z.string({ required_error: 'Role Required' }).min(1, { message: 'Role is required' }),
});