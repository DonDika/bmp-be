// controllers/shelf.controller.js
import { PrismaClient } from "@prisma/client";
import { shelfSchema } from "../utils/shelf.validation.js";

const prisma = new PrismaClient();

// GET ALL SHELF
export const getAllShelves = async (req, res) => {
  try {
    const shelves = await prisma.shelf.findMany({
      include: {
        item: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        warehouse: {
          select: {
            id: true,
          },
        },
      },
    });

    const formattedShelves = shelves.map((shelf) => ({
      id: shelf.id,
      location: shelf.location,
      position: shelf.position,
      stock_qty: shelf.stock_qty,
      created_at: shelf.created_at,
      warehouse: {
        warehouse_id: shelf.warehouse.id,
      },
      item: {
        item_id: shelf.item.id,
        item_name: shelf.item.name,
        item_code: shelf.item.code,
      },
    }));

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil data list shelf",
      data: formattedShelves,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data list shelf",
      error: err.message,
    });
  }
};

// GET SHELF BY WAREHOUSE ID
export const getShelvesByWarehouseId = async (req, res) => {
  const { warehouse_id } = req.params;

  try {
    const shelves = await prisma.shelf.findMany({
      where: {
        warehouse_id,
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        warehouse: {
          select: {
            id: true,
          },
        },
      },
    });

    const formattedShelves = shelves.map((shelf) => ({
      id: shelf.id,
      location: shelf.location,
      position: shelf.position,
      stock_qty: shelf.stock_qty,
      created_at: shelf.created_at,
      warehouse: {
        warehouse_id: shelf.warehouse.id,
      },
      item: {
        item_id: shelf.item.id,
        item_name: shelf.item.name,
        item_code: shelf.item.code,
      },
    }));

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil data shelf berdasarkan warehouse_id",
      data: formattedShelves,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data shelf",
      error: err.message,
    });
  }
};

// CREATE SHELF
export const createShelf = async (req, res) => {
  try {
    const data = shelfSchema.parse(req.body);

    // Cek apakah item_id ada
    const existingItem = await prisma.item.findUnique({
      where: { id: data.item_id },
    });

    if (!existingItem) {
      return res.status(400).json({
        success: false,
        message: "Item ID tidak ditemukan",
      });
    }

    // Cek apakah warehouse_id ada
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id: data.warehouse_id },
    });

    if (!existingWarehouse) {
      return res.status(400).json({
        success: false,
        message: "Warehouse ID tidak ditemukan",
      });
    }

    // Cek apakah kombinasi location + position sudah digunakan
    const existingShelf = await prisma.shelf.findFirst({
      where: {
        location: data.location,
        position: data.position,
      },
    });

    if (existingShelf) {
      return res.status(400).json({
        success: false,
        message: "Lokasi dan posisi tersebut sudah digunakan untuk item lain",
      });
    }

    const newShelf = await prisma.shelf.create({
      data,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        warehouse: {
          select: {
            id: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Rak berhasil ditambahkan",
      data: {
        id: newShelf.id,
        location: newShelf.location,
        position: newShelf.position,
        stock_qty: newShelf.stock_qty,
        created_at: newShelf.created_at,
        warehouse: {
          warehouse_id: newShelf.warehouse.id,
        },
        item: {
          item_id: newShelf.item.id,
          item_name: newShelf.item.name,
          item_code: newShelf.item.code,
        },
      },
    });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validasi gagal",
        errors: err.errors.map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menambahkan rak",
      error: err.message,
    });
  }
};

// UPDATE SHELF
export const updateShelf = async (req, res) => {
  const { id } = req.params;
  try {
    const data = shelfSchema.partial().parse(req.body);

    const existingShelf = await prisma.shelf.findUnique({ where: { id } });
    if (!existingShelf) {
      return res.status(404).json({
        success: false,
        message: "Rak tidak ditemukan",
      });
    }

    // Validasi jika location dan position disertakan
    if (data.location && data.position) {
      const conflict = await prisma.shelf.findFirst({
        where: {
          id: { not: id },
          location: data.location,
          position: data.position,
        },
      });

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: "Lokasi dan posisi tersebut sudah digunakan oleh rak lain",
        });
      }
    }

    const updated = await prisma.shelf.update({
      where: { id },
      data,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        warehouse: {
          select: {
            id: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Rak berhasil diperbarui",
      data: {
        id: updated.id,
        location: updated.location,
        position: updated.position,
        stock_qty: updated.stock_qty,
        created_at: updated.created_at,
        warehouse: {
          warehouse_id: updated.warehouse.id,
        },
        item: {
          item_id: updated.item.id,
          item_name: updated.item.name,
          item_code: updated.item.code,
        },
      },
    });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validasi gagal",
        errors: err.errors.map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat memperbarui rak",
      error: err.message,
    });
  }
};

// DELETE SHELF
export const deleteShelf = async (req, res) => {
  const { id } = req.params;
  try {
    const existingShelf = await prisma.shelf.findUnique({ where: { id } });
    if (!existingShelf) {
      return res.status(404).json({
        success: false,
        message: "Rak tidak ditemukan",
      });
    }

    await prisma.shelf.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Rak berhasil dihapus",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menghapus rak",
      error: err.message,
    });
  }
};
