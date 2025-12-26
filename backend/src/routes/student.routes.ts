import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../sockets/types';
import {
    getProfile,
    updateProfile,
    getDrives,
    getEligibleDrives,
    applyToDrive,
    getMyApplications,
    getApplicationDetails,
    getNotifications,
    markNotificationRead,
    getOffers,
    acceptOffer,
    declineOffer
} from '../controllers/student.controller';

const router = Router();

// All routes require authentication and STUDENT role
router.use(authenticate, authorize(UserRole.STUDENT));

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Drive routes
router.get('/drives', getDrives);
router.get('/drives/eligible', getEligibleDrives);
router.post('/apply/:driveId', applyToDrive);

// Application routes
router.get('/applications', getMyApplications);
router.get('/applications/:applicationId', getApplicationDetails);

// Notification routes
router.get('/notifications', getNotifications);
router.put('/notifications/:notificationId/read', markNotificationRead);

// Offer routes
router.get('/offers', getOffers);
router.put('/offers/:offerId/accept', acceptOffer);
router.put('/offers/:offerId/decline', declineOffer);

export default router;
