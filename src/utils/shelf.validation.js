import { z } from 'zod';

export const shelfSchema = z.object({
  location: z.string({ required_error: 'Lokasi harus diisi' }).min(1, 'Lokasi tidak boleh kosong'),
  position: z.string({ required_error: 'Posisi harus diisi' }).min(1, 'Posisi tidak boleh kosong'),
  stock_qty: z.number({ required_error: 'Jumlah stok harus diisi' })
  .nonnegative('Stok tidak boleh negatif'),
  item_id: z.string({ required_error: 'Item ID harus diisi' }),
  warehouse_id: z.string({ required_error: 'Warehouse ID harus diisi' }),
});
