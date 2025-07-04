import { z } from 'zod';

export const createDeliveryOrderSchema = z.object({
  no_do: z.string().optional(),
  status: z.optional(z.enum(['pending', 'done'], { message: 'Status harus "pending", atau "done"' })),
  remarks: z.string().optional(),
  material_request_id: z.string().uuid({ message: 'ID Material Request tidak valid' }),

  items: z.array(
    z.object({
      material_request_item_id: z.string().uuid({ message: 'ID Material Request Item tidak valid' }),
      quantity: z.number().int().min(1, { message: 'Quantity minimal 1' }),
    })
  ).min(1, { message: 'Minimal harus ada satu item' }),
});

export const createDeliveryOrderItemSchema = z.object({
  delivery_order_id: z.string().uuid({ message: 'ID Delivery Order tidak valid' }),
  material_request_item_id: z.string().uuid({ message: 'ID Material Request Item tidak valid' }),
  quantity: z.number().int().min(1, { message: 'Quantity minimal 1' }),
});
