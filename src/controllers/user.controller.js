import { PrismaClient } from '@prisma/client';
import { userSchema } from '../utils/user.validation.js';

const prisma = new PrismaClient();

// GET /user/claim
export const getUserClaim = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Data user berhasil diambil',
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan',
      error: err.message,
    });
  }
};

// Get /user/all
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data list user',
      data: users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data list user',
      error: err.message,
    });
  }
};

// GET /user/:id
export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data user',
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data user',
      error: err.message,
    });
  }
};

// POST /user
export const createUser = async (req, res) => {
  try {
    const data = userSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah digunakan',
      });
    }

    const newUser = await prisma.user.create({ data });

    res.status(201).json({
      success: true,
      message: 'User berhasil dibuat',
      data: newUser,
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: err.errors.map((e) => e.message),
      });
    }

    if (err.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Email sudah digunakan',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat user',
      error: err.message,
    });
  }
};

// PUT /user/:id
export const updateUser = async (req, res) => {
  const { id } = req.params;
  try {
    const data = userSchema.partial().parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    res.status(200).json({
      success: true,
      message: 'User berhasil diperbarui',
      data: updatedUser,
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: err.errors.map((e) => e.message),
      });
    }

    if (err.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Email sudah digunakan',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui user',
      error: err.message,
    });
  }
};

// DELETE /user/:id
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    await prisma.user.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'User berhasil dihapus',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus user',
      error: err.message,
    });
  }
};