import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';
import analyticsService from '../services/analytics.service';

// Get all drives (admin view)
export const getAllDrives = async (req: AuthRequest, res: Response) => {
    try {
        const result = await query(
            `SELECT pd.*, c.company_name, c.industry,
              (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id) as total_applicants,
              (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id AND overall_status = 'SELECTED') as selected
       FROM placement_drives pd
       JOIN companies c ON pd.company_id = c.id
       ORDER BY pd.created_at DESC`
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get all drives error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch drives' });
    }
};

// Get drive details
export const getDriveDetails = async (req: AuthRequest, res: Response) => {
    try {
        const { driveId } = req.params;

        const result = await query(
            `SELECT pd.*, c.company_name, c.industry, c.website, c.hr_contact_name,
              (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id) as total_applicants,
              (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id AND overall_status = 'IN_PROGRESS') as in_progress,
              (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id AND overall_status = 'SELECTED') as selected,
              (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id AND overall_status = 'REJECTED') as rejected
       FROM placement_drives pd
       JOIN companies c ON pd.company_id = c.id
       WHERE pd.id = $1`,
            [driveId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Drive not found' });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get drive details error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch drive details' });
    }
};

// Update drive status (activate/close)
export const updateDriveStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { driveId } = req.params;
        const { status } = req.body;

        if (!['ACTIVE', 'CLOSED', 'COMPLETED'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be ACTIVE, CLOSED, or COMPLETED'
            });
        }

        const result = await query(
            `UPDATE placement_drives 
       SET status = $1
       WHERE id = $2
       RETURNING *`,
            [status, driveId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Drive not found' });
        }

        // Broadcast analytics update
        await analyticsService.broadcastAnalyticsUpdate();

        res.json({
            success: true,
            message: 'Drive status updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update drive status error:', error);
        res.status(500).json({ success: false, error: 'Failed to update drive status' });
    }
};

// Get all students
export const getAllStudents = async (req: AuthRequest, res: Response) => {
    try {
        const result = await query(
            `SELECT s.*, 
              COUNT(DISTINCT a.id) as total_applications,
              COUNT(DISTINCT CASE 
                WHEN a.overall_status IN ('SELECTED', 'OFFER_ACCEPTED') 
                THEN a.id 
              END) as selected_count,
              COUNT(DISTINCT o.id) as offers_count,
              MAX(CASE 
                WHEN o.status = 'ACCEPTED' 
                THEN o.ctc 
              END) as accepted_ctc
       FROM students s
       LEFT JOIN applications a ON s.id = a.student_id
       LEFT JOIN offers o ON a.id = o.application_id
       GROUP BY s.id
       ORDER BY s.full_name`
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get all students error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch students' });
    }
};

// Get all companies
export const getAllCompanies = async (req: AuthRequest, res: Response) => {
    try {
        const result = await query(
            `SELECT c.*, 
              COUNT(DISTINCT pd.id) as drives_created,
              COUNT(DISTINCT a.id) as total_applicants,
              COUNT(DISTINCT o.id) as offers_made
       FROM companies c
       LEFT JOIN placement_drives pd ON c.id = pd.company_id
       LEFT JOIN applications a ON pd.id = a.drive_id
       LEFT JOIN offers o ON a.id = o.application_id
       GROUP BY c.id
       ORDER BY c.company_name`
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get all companies error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch companies' });
    }
};

// Get overall analytics
export const getOverallAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const analytics = await analyticsService.getOverallAnalytics();

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Get overall analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
    }
};

// Get department analytics
export const getDepartmentAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const { department } = req.params;

        const analytics = await analyticsService.getDepartmentAnalytics(department);

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Get department analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch department analytics' });
    }
};

// Get company analytics
export const getCompanyAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.params;

        const analytics = await analyticsService.getCompanyAnalytics(companyId);

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Get company analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch company analytics' });
    }
};

// Export placements data (CSV format)
export const exportPlacements = async (req: AuthRequest, res: Response) => {
    try {
        const result = await query(
            `SELECT 
         s.roll_number,
         s.full_name,
         s.email,
         s.department,
         s.cgpa,
         c.company_name,
         pd.title as job_role,
         o.ctc,
         o.joining_date,
         o.status as offer_status
       FROM students s
       JOIN applications a ON s.id = a.student_id
       JOIN placement_drives pd ON a.drive_id = pd.id
       JOIN companies c ON pd.company_id = c.id
       JOIN offers o ON a.id = o.application_id
       WHERE o.status = 'ACCEPTED'
       ORDER BY s.department, s.roll_number`
        );

        // Generate CSV
        const headers = ['Roll Number', 'Name', 'Email', 'Department', 'CGPA', 'Company', 'Job Role', 'CTC', 'Joining Date', 'Status'];
        const csvRows = [headers.join(',')];

        for (const row of result.rows) {
            const values = [
                row.roll_number,
                `"${row.full_name}"`,
                row.email,
                row.department,
                row.cgpa,
                `"${row.company_name}"`,
                `"${row.job_role}"`,
                row.ctc,
                row.joining_date || '',
                row.offer_status
            ];
            csvRows.push(values.join(','));
        }

        const csv = csvRows.join('\n');

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="placements.csv"');
        res.send(csv);
    } catch (error) {
        console.error('Export placements error:', error);
        res.status(500).json({ success: false, error: 'Failed to export placements' });
    }
};

// Export students data (CSV format)
export const exportStudents = async (req: AuthRequest, res: Response) => {
    try {
        const result = await query(
            `SELECT 
         s.*,
         COUNT(DISTINCT a.id) as application_count,
         COUNT(DISTINCT CASE 
           WHEN a.overall_status IN ('SELECTED', 'OFFER_ACCEPTED') 
           THEN a.id 
         END) as placement_status
       FROM students s
       LEFT JOIN applications a ON s.id = a.student_id
       GROUP BY s.id
       ORDER BY s.department, s.roll_number`
        );

        const headers = ['Roll Number', 'Name', 'Email', 'Department', 'CGPA', 'Graduation Year', 'Applications', 'Placed'];
        const csvRows = [headers.join(',')];

        for (const row of result.rows) {
            const values = [
                row.roll_number,
                `"${row.full_name}"`,
                row.email,
                row.department,
                row.cgpa,
                row.graduation_year,
                row.application_count,
                parseInt(row.placement_status) > 0 ? 'Yes' : 'No'
            ];
            csvRows.push(values.join(','));
        }

        const csv = csvRows.join('\n');

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="students.csv"');
        res.send(csv);
    } catch (error) {
        console.error('Export students error:', error);
        res.status(500).json({ success: false, error: 'Failed to export students' });
    }
};
