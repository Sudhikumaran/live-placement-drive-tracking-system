import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../sockets/types';
import {
    getProfile,
    updateProfile,
    getMyDrives,
    createDrive,
    updateDrive,
    getApplicants,
    updateShortlist,
    createOffer,
    getDriveAnalytics
} from '../controllers/company.controller';

const router = Router();

// All routes require authentication and COMPANY role
router.use(authenticate, authorize(UserRole.COMPANY));

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Drive routes
router.get('/drives', getMyDrives);
router.post('/drives', createDrive);
router.put('/drives/:driveId', updateDrive);
router.get('/drives/:driveId/applicants', getApplicants);

// Shortlist routes
router.post('/shortlist', updateShortlist);

// Offer routes
router.post('/offers', createOffer);

// Analytics routes
router.get('/analytics/:driveId', getDriveAnalytics);

export default router;
