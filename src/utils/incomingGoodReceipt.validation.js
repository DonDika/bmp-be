import { z } from 'zod'

export const igrItemSchema = z.object({
  purchase_order_item_id: z.string().uuid(),
  item_id: z.string().uuid(),
  shelf_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  status: z.enum(['received', 'pending', 'rejected']),
})

export const createIGRSchema = z.object({
  no_igr: z.string().optional(),
  received_date: z.coerce.date(),
  remarks: z.string().optional(),
  purchase_order_id: z.string().uuid(),
  items: z.array(igrItemSchema).min(1),
})

export const IGRItemStatusEnum = z.enum(['received', 'pending', 'rejected'])

export const updateIGRItemStatusSchema = z.object({
  status: IGRItemStatusEnum,
})