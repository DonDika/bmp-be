import { z } from 'zod';
import { listMappingLocation } from './generate/listMappingLocation.js';

export const locationSchema = z.object({
  name: z.string().min(1, 'Nama lokasi tidak boleh kosong').refine(val => {
    const key = val.trim().toLowerCase();
    return key in listMappingLocation;
  }, {
    message: 'Kode location untuk lokasi ini tidak ditemukan di daftar resmi',
  }),
});
