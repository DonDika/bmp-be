import { z } from 'zod';

// Schema untuk item dalam Purchase Order
export const purchaseOrderItemSchema = z.object({
  material_request_item_id: z.string().uuid({ message: 'ID item permintaan tidak valid' }),
  supplier: z.string().min(1, { message: 'Supplier harus diisi' }),
  quantity: z.number().int().positive({ message: 'Jumlah harus lebih dari 0' }),
  price: z.number().nonnegative({ message: 'Harga tidak boleh negatif' }),
  status: z.optional(z.enum(['pending', 'proses', 'done'], { message: 'Status harus "pending" atau "done"' })),
});

// Schema untuk Purchase Order
export const purchaseOrderSchema = z.object({
  no_po: z.string().optional(),
  created_by: z.string().uuid({ message: 'ID pembuat PO tidak valid' }),
  status: z.optional(z.enum(['draft', 'pending', 'proses', 'done'], { message: 'Status harus "draft", "pending", "proses", atau "done"' })),
  material_request_ids: z.array(z.string().uuid({ message: 'ID Material Request tidak valid' })).min(1, { message: 'Minimal 1 Material Request harus dipilih' }),
  items: z.array(purchaseOrderItemSchema).min(1, { message: 'Minimal 1 item harus dimasukkan ke dalam PO' }),
});
