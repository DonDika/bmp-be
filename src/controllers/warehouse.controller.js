import { PrismaClient } from '@prisma/client';
import { warehouseSchema } from '../utils/warehouse.validation.js';

const prisma = new PrismaClient();

// GET /warehouse/all
export const getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { created_at: 'desc' },
    });

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data list warehouse',
      data: warehouses,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data list warehouse',
      error: err.message,
    });
  }
};

// GET /warehouse/:id
export const getWarehouseById = async (req, res) => {
  const { id } = req.params;
  try {
    const warehouse = await prisma.warehouse.findUnique({ where: { id } });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse tidak ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data warehouse',
      data: warehouse,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data warehouse',
      error: err.message,
    });
  }
};

// POST /warehouse
export const createWarehouse = async (req, res) => {
  try {
    const data = warehouseSchema.parse(req.body);

    const newWarehouse = await prisma.warehouse.create({
      data,
    });

    res.status(201).json({
      success: true,
      message: 'Warehouse berhasil dibuat',
      data: newWarehouse,
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
        message: 'Name sudah digunakan',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat warehouse',
      error: err.message,
    });
  }
};

// PUT /warehouse/:id
export const updateWarehouse = async (req, res) => {
  const { id } = req.params;
  try {
    const data = warehouseSchema.partial().parse(req.body);

    const existingWarehouse = await prisma.warehouse.findUnique({ where: { id } });
    if (!existingWarehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse tidak ditemukan',
      });
    }

    const updatedWarehouse = await prisma.warehouse.update({
      where: { id },
      data,
    });

    res.status(200).json({
      success: true,
      message: 'Warehouse berhasil diperbarui',
      data: updatedWarehouse,
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: err.errors.map(e => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui warehouse',
      error: err.message,
    });
  }
};

// DELETE /warehouse/:id
export const deleteWarehouse = async (req, res) => {
  const { id } = req.params;
  try {
    const existingWarehouse = await prisma.warehouse.findUnique({ where: { id } });
    if (!existingWarehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse tidak ditemukan',
      });
    }

    await prisma.warehouse.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Warehouse berhasil dihapus',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus warehouse',
      error: err.message,
    });
  }
};