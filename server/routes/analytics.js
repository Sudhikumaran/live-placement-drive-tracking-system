import express from 'express';
import {
    getPlacementStats,
    getCompanyStats,
    getRoundStats,
    getStudentStats,
    getDashboardOverview,
    getDriveApplicantsSummary
} from '../controllers/analyticsController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All analytics routes are admin-only
router.get('/placement', authenticate, requireAdmin, getPlacementStats);
router.get('/companies', authenticate, requireAdmin, getCompanyStats);
router.get('/rounds', authenticate, requireAdmin, getRoundStats);
router.get('/students', authenticate, requireAdmin, getStudentStats);
router.get('/dashboard', authenticate, requireAdmin, getDashboardOverview);
router.get('/drive-applicants', authenticate, requireAdmin, getDriveApplicantsSummary);

export default router;
