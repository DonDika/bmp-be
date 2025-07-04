import { PrismaClient } from '@prisma/client';
import { locationSchema } from '../utils/location.validation.js';
import { uniqueCodeLocation } from '../utils/generate/uniqueCodeLocation.js';

const prisma = new PrismaClient();

// Get all locations
export const getAllLocations = async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { created_at: 'desc' },
    });

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data list lokasi',
      data: locations,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data lokasi',
      error: err.message,
    });
  }
};

// Get location by ID
export const getLocationById = async (req, res) => {
  const { id } = req.params;
  try {
    const location = await prisma.location.findUnique({ where: { id } });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Lokasi tidak ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil lokasi',
      data: location,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil lokasi',
      error: err.message,
    });
  }
};

// Create new location
export const createLocation = async (req, res) => {
  try {
    const data = locationSchema.parse(req.body);

    const code = await uniqueCodeLocation(data.name, prisma);

    const newLocation = await prisma.location.create({
      data: {
        name: data.name,
        code,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Lokasi berhasil dibuat',
      data: newLocation,
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
        message: 'Kode lokasi sudah digunakan',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat lokasi',
      error: err.message,
    });
  }
};

// Update location
export const updateLocation = async (req, res) => {
  const { id } = req.params;
  try {
    const data = locationSchema.partial().parse(req.body);

    const existingLocation = await prisma.location.findUnique({ where: { id } });
    if (!existingLocation) {
      return res.status(404).json({
        success: false,
        message: 'Lokasi tidak ditemukan',
      });
    }

    const updatedLocation = await prisma.location.update({
      where: { id },
      data,
    });

    res.status(200).json({
      success: true,
      message: 'Lokasi berhasil diperbarui',
      data: updatedLocation,
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
        message: 'Kode lokasi sudah digunakan',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui lokasi',
      error: err.message,
    });
  }
};

// Delete location
export const deleteLocation = async (req, res) => {
  const { id } = req.params;

  try {
    // Cek apakah lokasi ada dan ambil relasi MR
    const existingLocation = await prisma.location.findUnique({
      where: { id },
      include: {
        material_requests: {
          select: { id: true }, // hanya ambil ID MR
        },
      },
    });

    if (!existingLocation) {
      return res.status(404).json({
        success: false,
        message: 'Lokasi tidak ditemukan',
      });
    }

    const relatedMRs = existingLocation.material_requests;

    if (relatedMRs.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Lokasi tidak bisa dihapus karena masih digunakan di permintaan material',
        data: {
          material_request_count: relatedMRs.length,
          material_request_ids: relatedMRs.map(mr => mr.id),
        },
      });
    }

    // Hapus lokasi
    await prisma.location.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Lokasi berhasil dihapus',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal saat menghapus lokasi',
      error: err.message,
    });
  }
};
