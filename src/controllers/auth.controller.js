import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from '../utils/auth.validation.js';

const prisma = new PrismaClient();

export const register = async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email sudah digunakan' });
    }

    const hashed = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { email: body.email, password: hashed, role: 'user' }
    });

    res.status(201).json({
      success: true,
      message: 'User berhasil dibuat',
      data: { id: user.id, email: user.email, role: user.role }
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: err.errors.map(e => e.message)
      });
    }

    res.status(500).json({ success: false, message: 'Terjadi kesalahan', error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    const valid = await bcrypt.compare(body.password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Password salah' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ success: true, message: 'Login berhasil', token });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: err.errors.map(e => e.message)
      });
    }

    res.status(500).json({ success: false, message: 'Terjadi kesalahan', error: err.message });
  }
};
