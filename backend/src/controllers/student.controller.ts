import { Response } from 'express';
import { query, transaction } from '../config/database';
import { getIO } from '../config/socket';
import { AuthRequest } from '../types';
import { ApplicationStatus, SocketEvent, ApplicationSubmittedPayload } from '../sockets/types';
import notificationService from '../services/notification.service';

// Get student profile
export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user!.id;

        const result = await query(
            `SELECT id, email, full_name, roll_number, department, cgpa, graduation_year, resume_url, created_at
       FROM students WHERE id = $1`,
            [studentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
};

// Update student profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user!.id;
        const { fullName, cgpa, resumeUrl } = req.body;

        const result = await query(
            `UPDATE students 
       SET full_name = COALESCE($1, full_name),
           cgpa = COALESCE($2, cgpa),
           resume_url = COALESCE($3, resume_url)
       WHERE id = $4
       RETURNING id, full_name, cgpa, resume_url`,
            [fullName, cgpa, resumeUrl, studentId]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
};

// Browse all active drives
export const getDrives = async (req: AuthRequest, res: Response) => {
    try {
        const result = await query(
            `SELECT pd.*, c.company_name, c.industry,
              (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id) as applicant_count
       FROM placement_drives pd
       JOIN companies c ON pd.company_id = c.id
       WHERE pd.status = 'ACTIVE'
       ORDER BY pd.drive_date DESC, pd.created_at DESC`
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get drives error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch drives' });
    }
};

// Get eligible drives for student
export const getEligibleDrives = async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user!.id;

        // Get student details
        const studentResult = await query(
            `SELECT department, cgpa FROM students WHERE id = $1`,
            [studentId]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Student not found' });
        }

        const { department, cgpa } = studentResult.rows[0];

        // Get eligible drives
        const drivesResult = await query(
            `SELECT pd.*, c.company_name, c.industry,
              (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id) as applicant_count,
              (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id AND student_id = $1) as already_applied
       FROM placement_drives pd
       JOIN companies c ON pd.company_id = c.id
       WHERE pd.status = 'ACTIVE'
         AND $2 = ANY(pd.eligible_departments)
         AND pd.min_cgpa <= $3
       ORDER BY pd.drive_date DESC, pd.created_at DESC`,
            [studentId, department, cgpa]
        );

        res.json({
            success: true,
            data: drivesResult.rows
        });
    } catch (error) {
        console.error('Get eligible drives error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch eligible drives' });
    }
};

// Apply to a drive
export const applyToDrive = async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user!.id;
        const { driveId } = req.params;

        await transaction(async (client) => {
            // Check if already applied
            const existingApp = await client.query(
                `SELECT id FROM applications WHERE student_id = $1 AND drive_id = $2`,
                [studentId, driveId]
            );

            if (existingApp.rows.length > 0) {
                throw new Error('You have already applied to this drive');
            }

            // Check eligibility
            const eligibilityCheck = await client.query(
                `SELECT s.department, s.cgpa, s.full_name, s.roll_number,
                pd.min_cgpa, pd.eligible_departments, pd.title, pd.company_id,
                c.company_name
         FROM students s
         CROSS JOIN placement_drives pd
         JOIN companies c ON pd.company_id = c.id
         WHERE s.id = $1 AND pd.id = $2 AND pd.status = 'ACTIVE'`,
                [studentId, driveId]
            );

            if (eligibilityCheck.rows.length === 0) {
                throw new Error('Drive not found or not active');
            }

            const { department, cgpa, full_name, roll_number, min_cgpa, eligible_departments, title, company_id, company_name } = eligibilityCheck.rows[0];

            if (!eligible_departments.includes(department)) {
                throw new Error(`This drive is not open for ${department} department`);
            }

            if (cgpa < min_cgpa) {
                throw new Error(`Minimum CGPA required is ${min_cgpa}`);
            }

            // Create application
            const appResult = await client.query(
                `INSERT INTO applications (student_id, drive_id, current_round, overall_status)
         VALUES ($1, $2, 0, $3)
         RETURNING *`,
                [studentId, driveId, ApplicationStatus.APPLIED]
            );

            const application = appResult.rows[0];

            // Emit Socket.IO event to company
            const payload: ApplicationSubmittedPayload = {
                applicationId: application.id,
                studentId: studentId,
                studentName: full_name,
                rollNumber: roll_number,
                department: department,
                driveId: driveId,
                driveName: title,
                companyId: company_id,
                appliedAt: application.applied_at.toISOString()
            };

            const io = getIO();
            io.to(`user:${company_id}`).emit(SocketEvent.APPLICATION_SUBMITTED, payload);

            // Create notification for company
            await notificationService.notifyApplicationSubmitted(
                studentId,
                full_name,
                company_id,
                title,
                driveId
            );

            return application;
        });

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully'
        });
    } catch (error: any) {
        console.error('Apply to drive error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to apply to drive'
        });
    }
};

// Get my applications
export const getMyApplications = async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user!.id;

        const result = await query(
            `SELECT a.*, 
              pd.title, pd.job_role, pd.ctc, pd.total_rounds, pd.drive_date,
              c.company_name, c.industry,
              (SELECT json_agg(sr ORDER BY sr.round_number)
               FROM shortlist_rounds sr
               WHERE sr.application_id = a.id) as rounds,
              o.id as offer_id, o.ctc as offer_ctc, o.status as offer_status
       FROM applications a
       JOIN placement_drives pd ON a.drive_id = pd.id
       JOIN companies c ON pd.company_id = c.id
       LEFT JOIN offers o ON a.id = o.application_id
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
            [studentId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get my applications error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch applications' });
    }
};

// Get application details with round history
export const getApplicationDetails = async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user!.id;
        const { applicationId } = req.params;

        const result = await query(
            `SELECT a.*, 
              pd.title, pd.job_role, pd.ctc, pd.description, pd.location, pd.total_rounds, pd.drive_date,
              c.company_name, c.industry, c.website,
              (SELECT json_agg(sr ORDER BY sr.round_number)
               FROM shortlist_rounds sr
               WHERE sr.application_id = a.id) as rounds,
              o.id as offer_id, o.ctc as offer_ctc, o.joining_date, o.status as offer_status
       FROM applications a
       JOIN placement_drives pd ON a.drive_id = pd.id
       JOIN companies c ON pd.company_id = c.id
       LEFT JOIN offers o ON a.id = o.application_id
       WHERE a.id = $1 AND a.student_id = $2`,
            [applicationId, studentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Application not found' });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get application details error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch application details' });
    }
};

// Get notifications
export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user!.id;
        const limit = parseInt(req.query.limit as string) || 50;

        const result = await query(
            `SELECT n.*,
              pd.title as drive_title
       FROM notifications n
       LEFT JOIN placement_drives pd ON n.related_drive_id = pd.id
       WHERE n.user_id = $1 AND n.user_role = 'STUDENT'
       ORDER BY n.created_at DESC
       LIMIT $2`,
            [studentId, limit]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
    }
};

// Mark notification as read
export const markNotificationRead = async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user!.id;
        const { notificationId } = req.params;

        const success = await notificationService.markAsRead(notificationId, studentId);

        if (!success) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
    }
};

// Get offers
export const getOffers = async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user!.id;

        const result = await query(
            `SELECT o.*, a.drive_id,
              pd.title, pd.job_role, pd.location,
              c.company_name, c.industry
       FROM offers o
       JOIN applications a ON o.application_id = a.id
       JOIN placement_drives pd ON a.drive_id = pd.id
       JOIN companies c ON pd.company_id = c.id
       WHERE a.student_id = $1
       ORDER BY o.created_at DESC`,
            [studentId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get offers error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch offers' });
    }
};

// Accept offer
export const acceptOffer = async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user!.id;
        const { offerId } = req.params;

        await transaction(async (client) => {
            // Update offer status
            const result = await client.query(
                `UPDATE offers o
         SET status = 'ACCEPTED'
         FROM applications a
         WHERE o.application_id = a.id
           AND o.id = $1
           AND a.student_id = $2
           AND o.status = 'PENDING'
         RETURNING o.id, o.application_id`,
                [offerId, studentId]
            );

            if (result.rows.length === 0) {
                throw new Error('Offer not found or already processed');
            }

            // Update application status
            await client.query(
                `UPDATE applications
         SET overall_status = $1
         WHERE id = $2`,
                [ApplicationStatus.OFFER_ACCEPTED, result.rows[0].application_id]
            );
        });

        res.json({
            success: true,
            message: 'Offer accepted successfully'
        });
    } catch (error: any) {
        console.error('Accept offer error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to accept offer'
        });
    }
};

// Decline offer
export const declineOffer = async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user!.id;
        const { offerId } = req.params;

        await transaction(async (client) => {
            const result = await client.query(
                `UPDATE offers o
         SET status = 'DECLINED'
         FROM applications a
         WHERE o.application_id = a.id
           AND o.id = $1
           AND a.student_id = $2
           AND o.status = 'PENDING'
         RETURNING o.id, o.application_id`,
                [offerId, studentId]
            );

            if (result.rows.length === 0) {
                throw new Error('Offer not found or already processed');
            }

            await client.query(
                `UPDATE applications
         SET overall_status = $1
         WHERE id = $2`,
                [ApplicationStatus.OFFER_DECLINED, result.rows[0].application_id]
            );
        });

        res.json({
            success: true,
            message: 'Offer declined'
        });
    } catch (error: any) {
        console.error('Decline offer error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to decline offer'
        });
    }
};
