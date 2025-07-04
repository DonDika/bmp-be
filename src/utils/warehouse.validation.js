import { z } from 'zod';

export const warehouseSchema = z.object({
  name: z.string({ required_error: 'Name Required' }).min(3, 'name must be at least 3 characters'),
  location: z.string({ required_error: 'Location Required' }).min(1, 'Location is required'),
  contact: z.string({ required_error: 'Contact Required' }).min(1, 'Contact is required'),
});