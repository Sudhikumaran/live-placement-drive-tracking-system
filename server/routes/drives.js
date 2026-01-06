import express from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import {
    createDrive,
    getAllDrives,
    getDriveById,
    updateDrive,
    deleteDrive,
    uploadShortlist
} from '../controllers/driveController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const driveValidators = [
    body('companyName').trim().notEmpty().withMessage('Company name is required'),
    body('role').trim().notEmpty().withMessage('Role is required'),
    body('ctc').trim().notEmpty().withMessage('CTC is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('deadline').isISO8601().withMessage('Deadline must be a valid date'),
    body('status').optional().isIn(['upcoming', 'ongoing', 'closed']).withMessage('Invalid status'),
    body('eligibility.minCgpa').isFloat({ min: 0, max: 10 }).withMessage('Min CGPA must be between 0 and 10'),
    body('eligibility.departments').isArray({ min: 1 }).withMessage('Departments must be an array'),
    body('eligibility.departments.*').trim().notEmpty().withMessage('Department cannot be empty'),
    body('rounds').optional().isArray().withMessage('Rounds must be an array'),
    body('rounds.*.name').optional().trim().notEmpty().withMessage('Round name is required')
];

const updateValidators = [
    body('companyName').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
    body('role').optional().trim().notEmpty().withMessage('Role cannot be empty'),
    body('ctc').optional().trim().notEmpty().withMessage('CTC cannot be empty'),
    body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
    body('deadline').optional().isISO8601().withMessage('Deadline must be a valid date'),
    body('status').optional().isIn(['upcoming', 'ongoing', 'closed']).withMessage('Invalid status'),
    body('eligibility.minCgpa').optional().isFloat({ min: 0, max: 10 }).withMessage('Min CGPA must be between 0 and 10'),
    body('eligibility.departments').optional().isArray({ min: 1 }).withMessage('Departments must be an array'),
    body('eligibility.departments.*').optional().trim().notEmpty().withMessage('Department cannot be empty'),
    body('rounds').optional().isArray().withMessage('Rounds must be an array'),
    body('rounds.*.name').optional().trim().notEmpty().withMessage('Round name is required')
];

// Public/Protected routes
router.get('/', authenticate, getAllDrives);
router.get('/:id', authenticate, getDriveById);

// Admin only routes
router.post('/', authenticate, requireAdmin, validate(driveValidators), createDrive);
router.put('/:id', authenticate, requireAdmin, validate(updateValidators), updateDrive);
router.delete('/:id', authenticate, requireAdmin, deleteDrive);
router.post('/:id/shortlist', authenticate, requireAdmin, upload.single('file'), uploadShortlist);

export default router;
