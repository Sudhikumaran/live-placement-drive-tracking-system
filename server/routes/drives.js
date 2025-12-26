import express from 'express';
import multer from 'multer';
import {
    createDrive,
    getAllDrives,
    getDriveById,
    updateDrive,
    deleteDrive,
    uploadShortlist
} from '../controllers/driveController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public/Protected routes
router.get('/', authenticate, getAllDrives);
router.get('/:id', authenticate, getDriveById);

// Admin only routes
router.post('/', authenticate, requireAdmin, createDrive);
router.put('/:id', authenticate, requireAdmin, updateDrive);
router.delete('/:id', authenticate, requireAdmin, deleteDrive);
router.post('/:id/shortlist', authenticate, requireAdmin, upload.single('file'), uploadShortlist);

export default router;
