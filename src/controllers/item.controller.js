import { PrismaClient } from '@prisma/client';
import { itemSchema } from '../utils/item.validation.js';

const prisma = new PrismaClient();

// Get all items
export const getAllItems = async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      orderBy: { created_at: 'desc' },
    });

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data list item',
      data: items,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data list item',
      error: err.message,
    });
  }
};

// Get item by ID
export const getItemById = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await prisma.item.findUnique({ where: { id } });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item tidak ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil item',
      data: item,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan',
      error: err.message,
    });
  }
};

// Create new item
export const createItem = async (req, res) => {
  try {
    const data = itemSchema.parse(req.body);

    const newItem = await prisma.item.create({
      data,
    });

    res.status(201).json({
      success: true,
      message: 'Item berhasil dibuat',
      data: newItem,
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: err.errors.map(e => e.message),
      });
    }

    if (err.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Part number sudah digunakan',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat item',
      error: err.message,
    });
  }
};

// Update item
export const updateItem = async (req, res) => {
  const { id } = req.params;
  try {
    const data = itemSchema.partial().parse(req.body);

    const existingItem = await prisma.item.findUnique({ where: { id } });
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Item tidak ditemukan',
      });
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data,
    });

    res.status(200).json({
      success: true,
      message: 'Item berhasil diperbarui',
      data: updatedItem,
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: err.errors.map(e => e.message),
      });
    }

    if (err.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Part number sudah digunakan',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui item',
      error: err.message,
    });
  }
};

// Delete item
export const deleteItem = async (req, res) => {
  const { id } = req.params;

  try {
    const existingItem = await prisma.item.findUnique({
      where: { id },
      include: {
        shelves: {
          select: { id: true },
        },
        request_items: {
          select: { id: true, material_request_id: true },
        },
      },
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Item tidak ditemukan',
      });
    }

    // Cek apakah item digunakan di Shelf
    if (existingItem.shelves.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Item tidak bisa dihapus karena masih digunakan di rak (shelf)',
        data: {
          shelf_count: existingItem.shelves.length,
          shelf_ids: existingItem.shelves.map((shelf) => shelf.id),
        },
      });
    }

    // Cek apakah item digunakan di Material Request
    if (existingItem.request_items.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Item tidak bisa dihapus karena masih digunakan di permintaan material',
        data: {
          material_request_item_count: existingItem.request_items.length,
          material_request_ids: [
            ...new Set(existingItem.request_items.map((item) => item.material_request_id)),
          ],
        },
      });
    }

    // Hapus item
    await prisma.item.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Item berhasil dihapus',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal saat menghapus item',
      error: err.message,
    });
  }
};
