import { z } from 'zod';

export const itemSchema = z.object({
  name: z.string({ required_error: 'Name Required' }).min(3, 'Name must be at least 3 characters'),
  code: z.string({ required_error: 'Code Required' }).min(1, 'Code is required'),
  part_number: z.string({ required_error: 'Part number Required' }).min(1, 'Part number is required'),
});
