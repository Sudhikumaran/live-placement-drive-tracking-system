import express from 'express';
import { body, param } from 'express-validator';
import {
    applyToDrive,
    getStudentApplications,
    getDriveApplications,
    updateRoundStatus,
    getMyApplications
} from '../controllers/applicationController.js';
import { authenticate, requireAdmin, requireStudent } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const applyValidator = [
    body('driveId').isMongoId().withMessage('driveId must be a valid id')
];

const roundUpdateValidator = [
    param('applicationId').isMongoId().withMessage('applicationId must be a valid id'),
    body('round').trim().notEmpty().withMessage('round is required'),
    body('status')
        .trim()
        .isIn(['selected', 'rejected', 'in-progress', 'pending', 'shortlisted'])
        .withMessage('status is invalid')
];

// Student routes
router.post('/apply', authenticate, requireStudent, validate(applyValidator), applyToDrive);
router.get('/my-applications', authenticate, requireStudent, getMyApplications);

// Mixed routes
router.get('/student/:id', authenticate, getStudentApplications);

// Admin routes
router.get('/drive/:id', authenticate, requireAdmin, getDriveApplications);
router.put('/:applicationId/round', authenticate, requireAdmin, validate(roundUpdateValidator), updateRoundStatus);

export default router;
