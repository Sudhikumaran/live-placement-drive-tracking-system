import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../sockets/types';
import {
    getAllDrives,
    getDriveDetails,
    updateDriveStatus,
    getAllStudents,
    getAllCompanies,
    getOverallAnalytics,
    getDepartmentAnalytics,
    getCompanyAnalytics,
    exportPlacements,
    exportStudents
} from '../controllers/admin.controller';

const router = Router();

// All routes require authentication and ADMIN role
router.use(authenticate, authorize(UserRole.ADMIN));

// Drive management routes
router.get('/drives', getAllDrives);
router.get('/drives/:driveId', getDriveDetails);
router.put('/drives/:driveId/status', updateDriveStatus);

// User management routes
router.get('/students', getAllStudents);
router.get('/companies', getAllCompanies);

// Analytics routes
router.get('/analytics/overview', getOverallAnalytics);
router.get('/analytics/department/:department', getDepartmentAnalytics);
router.get('/analytics/company/:companyId', getCompanyAnalytics);

// Export routes
router.get('/export/placements', exportPlacements);
router.get('/export/students', exportStudents);

export default router;
