import express from 'express';
import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/item.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/all', authenticate, authorize('admin'), getAllItems);
router.get('/:id', authenticate, authorize('admin'), getItemById);
router.post('/', authenticate, authorize('admin'), createItem);
router.put('/:id', authenticate, authorize('admin'), updateItem);
router.delete('/:id', authenticate, authorize('admin'), deleteItem);

export default router;
