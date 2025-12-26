import { Response } from 'express';
import { query, transaction } from '../config/database';
import { getIO } from '../config/socket';
import { AuthRequest, CreateDriveRequest, ShortlistRequest, CreateOfferRequest } from '../types';
import {
    ApplicationStatus,
    RoundStatus,
    DriveStatus,
    SocketEvent,
    DriveCreatedPayload,
    ShortlistUpdatePayload,
    OfferPayload
} from '../sockets/types';
import notificationService from '../services/notification.service';

// Get company profile
export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.id;

        const result = await query(
            `SELECT id, email, company_name, industry, website, hr_contact_name, hr_contact_phone, created_at
       FROM companies WHERE id = $1`,
            [companyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Company not found' });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get company profile error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
};

// Update company profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.id;
        const { companyName, industry, website, hrContactName, hrContactPhone } = req.body;

        const result = await query(
            `UPDATE companies 
       SET company_name = COALESCE($1, company_name),
           industry = COALESCE($2, industry),
           website = COALESCE($3, website),
           hr_contact_name = COALESCE($4, hr_contact_name),
           hr_contact_phone = COALESCE($5, hr_contact_phone)
       WHERE id = $6
       RETURNING *`,
            [companyName, industry, website, hrContactName, hrContactPhone, companyId]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update company profile error:', error);
        res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
};

// Get my drives
export const getMyDrives = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.id;

        const result = await query(
            `SELECT pd.*,
              (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id) as total_applicants,
              (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id AND overall_status = 'IN_PROGRESS') as in_progress,
              (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id AND overall_status = 'SELECTED') as selected,
              (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id AND overall_status = 'REJECTED') as rejected
       FROM placement_drives pd
       WHERE pd.company_id = $1
       ORDER BY pd.drive_date DESC, pd.created_at DESC`,
            [companyId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get my drives error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch drives' });
    }
};

// Create new drive
export const createDrive = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.id;
        const {
            title,
            description,
            jobRole,
            ctc,
            location,
            eligibleDepartments,
            minCgpa,
            totalRounds,
            driveDate
        } = req.body as CreateDriveRequest;

        // Validation
        if (!title || !jobRole || !ctc || !eligibleDepartments || eligibleDepartments.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Required fields: title, jobRole, ctc, eligibleDepartments'
            });
        }

        const result = await query(
            `INSERT INTO placement_drives 
       (company_id, title, description, job_role, ctc, location, eligible_departments, min_cgpa, total_rounds, status, drive_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
            [
                companyId,
                title,
                description,
                jobRole,
                ctc,
                location,
                eligibleDepartments,
                minCgpa || 0,
                totalRounds || 1,
                DriveStatus.ACTIVE,
                driveDate ? new Date(driveDate) : null
            ]
        );

        const drive = result.rows[0];

        // Get company name
        const companyResult = await query(
            `SELECT company_name FROM companies WHERE id = $1`,
            [companyId]
        );
        const companyName = companyResult.rows[0].company_name;

        // Emit Socket.IO event to eligible students
        const payload: DriveCreatedPayload = {
            driveId: drive.id,
            companyId: companyId,
            companyName: companyName,
            title: drive.title,
            jobRole: drive.job_role,
            ctc: drive.ctc,
            eligibleDepartments: drive.eligible_departments,
            minCgpa: drive.min_cgpa,
            driveDate: drive.drive_date ? drive.drive_date.toISOString() : '',
            createdAt: drive.created_at.toISOString()
        };

        const io = getIO();
        io.to('role:STUDENT').emit(SocketEvent.DRIVE_CREATED, payload);

        res.status(201).json({
            success: true,
            message: 'Drive created successfully',
            data: drive
        });
    } catch (error) {
        console.error('Create drive error:', error);
        res.status(500).json({ success: false, error: 'Failed to create drive' });
    }
};

// Update drive
export const updateDrive = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.id;
        const { driveId } = req.params;
        const { title, description, jobRole, ctc, location, status, driveDate } = req.body;

        const result = await query(
            `UPDATE placement_drives 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           job_role = COALESCE($3, job_role),
           ctc = COALESCE($4, ctc),
           location = COALESCE($5, location),
           status = COALESCE($6, status),
           drive_date = COALESCE($7, drive_date)
       WHERE id = $8 AND company_id = $9
       RETURNING *`,
            [title, description, jobRole, ctc, location, status, driveDate ? new Date(driveDate) : null, driveId, companyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Drive not found' });
        }

        res.json({
            success: true,
            message: 'Drive updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update drive error:', error);
        res.status(500).json({ success: false, error: 'Failed to update drive' });
    }
};

// Get applicants for a drive
export const getApplicants = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.id;
        const { driveId } = req.params;

        // Verify drive belongs to company
        const driveCheck = await query(
            `SELECT id FROM placement_drives WHERE id = $1 AND company_id = $2`,
            [driveId, companyId]
        );

        if (driveCheck.rows.length === 0) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const result = await query(
            `SELECT a.*,
              s.full_name, s.roll_number, s.department, s.cgpa, s.graduation_year, s.resume_url, s.email,
              (SELECT json_agg(sr ORDER BY sr.round_number)
               FROM shortlist_rounds sr
               WHERE sr.application_id = a.id) as rounds
       FROM applications a
       JOIN students s ON a.student_id = s.id
       WHERE a.drive_id = $1
       ORDER BY a.applied_at DESC`,
            [driveId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get applicants error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch applicants' });
    }
};

// Shortlist/Reject student for a round
export const updateShortlist = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.id;
        const { applicationId, roundNumber, roundName, status, feedback } = req.body as ShortlistRequest;

        // Validate status
        if (status !== 'SELECTED' && status !== 'REJECTED') {
            return res.status(400).json({
                success: false,
                error: 'Status must be SELECTED or REJECTED'
            });
        }

        let newOverallStatus: ApplicationStatus;
        let studentId: string;
        let studentName: string;
        let driveId: string;
        let driveName: string;

        await transaction(async (client) => {
            // Verify application belongs to company's drive
            const appCheck = await client.query(
                `SELECT a.student_id, a.drive_id, a.overall_status, a.current_round,
                s.full_name, pd.title, pd.total_rounds, pd.company_id, c.company_name
         FROM applications a
         JOIN students s ON a.student_id = s.id
         JOIN placement_drives pd ON a.drive_id = pd.id
         JOIN companies c ON pd.company_id = c.id
         WHERE a.id = $1`,
                [applicationId]
            );

            if (appCheck.rows.length === 0) {
                throw new Error('Application not found');
            }

            const appData = appCheck.rows[0];

            if (appData.company_id !== companyId) {
                throw new Error('Access denied');
            }

            studentId = appData.student_id;
            studentName = appData.full_name;
            driveId = appData.drive_id;
            driveName = appData.title;
            const companyName = appData.company_name;
            const totalRounds = appData.total_rounds;

            // Insert or update round status
            await client.query(
                `INSERT INTO shortlist_rounds (application_id, round_number, round_name, status, feedback, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (application_id, round_number)
         DO UPDATE SET status = $4, round_name = $3, feedback = $5, updated_by = $6`,
                [applicationId, roundNumber, roundName, status, feedback, companyId]
            );

            // Update application status
            if (status === 'REJECTED') {
                newOverallStatus = ApplicationStatus.REJECTED;
            } else if (roundNumber >= totalRounds) {
                // Last round passed
                newOverallStatus = ApplicationStatus.SELECTED;
            } else {
                newOverallStatus = ApplicationStatus.IN_PROGRESS;
            }

            await client.query(
                `UPDATE applications 
         SET overall_status = $1, current_round = $2
         WHERE id = $3`,
                [newOverallStatus, roundNumber, applicationId]
            );

            // Emit Socket.IO event to student
            const shortlistPayload: ShortlistUpdatePayload = {
                applicationId: applicationId,
                studentId: studentId,
                studentName: studentName,
                companyId: companyId,
                companyName: companyName,
                driveId: driveId,
                driveName: driveName,
                roundNumber: roundNumber,
                roundName: roundName || `Round ${roundNumber}`,
                status: status as RoundStatus,
                overallStatus: newOverallStatus,
                feedback: feedback,
                updatedAt: new Date().toISOString()
            };

            const io = getIO();
            io.to(`user:${studentId}`).emit(SocketEvent.SHORTLIST_UPDATE, shortlistPayload);

            // Create notification for student
            await notificationService.notifyShortlistUpdate(
                studentId,
                studentName,
                companyName,
                driveName,
                driveId,
                roundNumber,
                roundName || `Round ${roundNumber}`,
                status
            );
        });

        res.json({
            success: true,
            message: 'Shortlist updated successfully',
            data: {
                applicationId,
                newOverallStatus
            }
        });
    } catch (error: any) {
        console.error('Update shortlist error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to update shortlist'
        });
    }
};

// Create offer for selected student
export const createOffer = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.id;
        const { applicationId, ctc, joiningDate, offerLetterUrl } = req.body as CreateOfferRequest;

        let studentId: string;
        let studentName: string;
        let driveName: string;
        let driveId: string;

        await transaction(async (client) => {
            // Verify application belongs to company and is selected
            const appCheck = await client.query(
                `SELECT a.student_id, a.drive_id, a.overall_status,
                s.full_name, pd.title, pd.company_id, c.company_name
         FROM applications a
         JOIN students s ON a.student_id = s.id
         JOIN placement_drives pd ON a.drive_id = pd.id
         JOIN companies c ON pd.company_id = c.id
         WHERE a.id = $1`,
                [applicationId]
            );

            if (appCheck.rows.length === 0) {
                throw new Error('Application not found');
            }

            const appData = appCheck.rows[0];

            if (appData.company_id !== companyId) {
                throw new Error('Access denied');
            }

            if (appData.overall_status !== ApplicationStatus.SELECTED) {
                throw new Error('Can only create offer for selected candidates');
            }

            studentId = appData.student_id;
            studentName = appData.full_name;
            driveId = appData.drive_id;
            driveName = appData.title;
            const companyName = appData.company_name;

            // Create offer
            const offerResult = await client.query(
                `INSERT INTO offers (application_id, ctc, joining_date, offer_letter_url, status)
         VALUES ($1, $2, $3, $4, 'PENDING')
         ON CONFLICT (application_id)
         DO UPDATE SET ctc = $2, joining_date = $3, offer_letter_url = $4, status = 'PENDING'
         RETURNING *`,
                [applicationId, ctc, joiningDate ? new Date(joiningDate) : null, offerLetterUrl]
            );

            const offer = offerResult.rows[0];

            // Emit Socket.IO event to student
            const offerPayload: OfferPayload = {
                offerId: offer.id,
                applicationId: applicationId,
                studentId: studentId,
                studentName: studentName,
                companyId: companyId,
                companyName: companyName,
                driveName: driveName,
                ctc: offer.ctc,
                joiningDate: offer.joining_date ? offer.joining_date.toISOString() : undefined,
                status: offer.status,
                createdAt: offer.created_at.toISOString()
            };

            const io = getIO();
            io.to(`user:${studentId}`).emit(SocketEvent.OFFER_CREATED, offerPayload);

            // Create notification for student
            await notificationService.notifyOfferCreated(studentId, companyName, driveName, driveId, ctc);
        });

        res.status(201).json({
            success: true,
            message: 'Offer created successfully'
        });
    } catch (error: any) {
        console.error('Create offer error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to create offer'
        });
    }
};

// Get analytics for a drive
export const getDriveAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.id;
        const { driveId } = req.params;

        // Verify access
        const driveCheck = await query(
            `SELECT id FROM placement_drives WHERE id = $1 AND company_id = $2`,
            [driveId, companyId]
        );

        if (driveCheck.rows.length === 0) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        // Get overall stats
        const overallStats = await query(
            `SELECT 
         COUNT(*) as total_applicants,
         COUNT(*) FILTER (WHERE overall_status = 'APPLIED') as applied,
         COUNT(*) FILTER (WHERE overall_status = 'IN_PROGRESS') as in_progress,
         COUNT(*) FILTER (WHERE overall_status = 'SELECTED') as selected,
         COUNT(*) FILTER (WHERE overall_status = 'REJECTED') as rejected
       FROM applications
       WHERE drive_id = $1`,
            [driveId]
        );

        // Department-wise breakdown
        const departmentStats = await query(
            `SELECT 
         s.department,
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE a.overall_status = 'SELECTED') as selected
       FROM applications a
       JOIN students s ON a.student_id = s.id
       WHERE a.drive_id = $1
       GROUP BY s.department`,
            [driveId]
        );

        // Round-wise dropoff
        const roundStats = await query(
            `SELECT 
         round_number,
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'SELECTED') as selected,
         COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected
       FROM shortlist_rounds
       WHERE application_id IN (SELECT id FROM applications WHERE drive_id = $1)
       GROUP BY round_number
       ORDER BY round_number`,
            [driveId]
        );

        res.json({
            success: true,
            data: {
                overall: overallStats.rows[0],
                byDepartment: departmentStats.rows,
                byRound: roundStats.rows
            }
        });
    } catch (error) {
        console.error('Get drive analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
    }
};
