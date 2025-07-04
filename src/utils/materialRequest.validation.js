import { z } from 'zod';

// Schema untuk material request item
export const materialRequestItemSchema = z.object({
  item_id: z.string().uuid({ message: 'Item ID tidak valid' }),
  quantity: z.number().int().positive({ message: 'Jumlah harus lebih dari 0' }),
  duration: z.number().int().nonnegative({ message: 'Durasi tidak boleh negatif' }),
  status: z.optional(z.enum(['pending', 'proses', 'done'], { message: 'Status harus "pending" atau "done"' })),
});

// Schema untuk material request
export const materialRequestSchema = z.object({
  no_mr: z.string().optional(),
  location_id: z.string().uuid({ message: 'Lokasi tidak valid' }),
  created_by: z.string().uuid({ message: 'Pembuat tidak valid' }),
  remarks: z.string().optional(),
  items: z.array(materialRequestItemSchema).min(1, { message: 'Minimal 1 item diperlukan' }),
});
