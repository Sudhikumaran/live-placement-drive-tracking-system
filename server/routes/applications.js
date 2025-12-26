import express from 'express';
import {
    applyToDrive,
    getStudentApplications,
    getDriveApplications,
    updateRoundStatus,
    getMyApplications
} from '../controllers/applicationController.js';
import { authenticate, requireAdmin, requireStudent } from '../middleware/auth.js';

const router = express.Router();

// Student routes
router.post('/apply', authenticate, requireStudent, applyToDrive);
router.get('/my-applications', authenticate, requireStudent, getMyApplications);

// Mixed routes
router.get('/student/:id', authenticate, getStudentApplications);

// Admin routes
router.get('/drive/:id', authenticate, requireAdmin, getDriveApplications);
router.put('/:applicationId/round', authenticate, requireAdmin, updateRoundStatus);

export default router;
