import { query } from '../config/database';
import { getIO } from '../config/socket';
import { AnalyticsUpdatePayload, SocketEvent } from '../sockets/types';
import { OverallAnalytics } from '../types';

export class AnalyticsService {
    /**
     * Get overall placement analytics
     */
    async getOverallAnalytics(): Promise<OverallAnalytics> {
        try {
            // Get total students
            const studentStats = await query(
                `SELECT 
           COUNT(*) as total_students,
           COUNT(DISTINCT CASE 
             WHEN a.overall_status IN ('SELECTED', 'OFFER_ACCEPTED') 
             THEN a.student_id 
           END) as placed_students,
           COUNT(DISTINCT CASE 
             WHEN (SELECT COUNT(*) FROM offers o2 
                   JOIN applications a2 ON o2.application_id = a2.id 
                   WHERE a2.student_id = s.id) > 1 
             THEN s.id 
           END) as multiple_offer_students
         FROM students s
         LEFT JOIN applications a ON s.id = a.student_id`
            );

            const totalStudents = parseInt(studentStats.rows[0].total_students);
            const placedStudents = parseInt(studentStats.rows[0].placed_students);
            const multipleOfferStudents = parseInt(studentStats.rows[0].multiple_offer_students);
            const placementPercentage = totalStudents > 0 ? (placedStudents / totalStudents) * 100 : 0;

            // Get drive stats
            const driveStats = await query(
                `SELECT 
           COUNT(*) as total_drives,
           COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_drives,
           COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_drives
         FROM placement_drives`
            );

            // Get application stats
            const appStats = await query(
                `SELECT 
           COUNT(*) as total_applications,
           COUNT(DISTINCT student_id) as unique_applicants
         FROM applications`
            );

            const totalApplications = parseInt(appStats.rows[0].total_applications);
            const uniqueApplicants = parseInt(appStats.rows[0].unique_applicants);
            const averageApplicationsPerStudent = uniqueApplicants > 0
                ? totalApplications / uniqueApplicants
                : 0;

            // Get offer stats
            const offerStats = await query(
                `SELECT 
           COUNT(*) as total_offers,
           COUNT(*) FILTER (WHERE status = 'ACCEPTED') as offers_accepted,
           COUNT(*) FILTER (WHERE status = 'PENDING') as offers_pending
         FROM offers`
            );

            const totalOffers = parseInt(offerStats.rows[0].total_offers);
            const offersAccepted = parseInt(offerStats.rows[0].offers_accepted);
            const offersPending = parseInt(offerStats.rows[0].offers_pending);
            const acceptanceRate = totalOffers > 0 ? (offersAccepted / totalOffers) * 100 : 0;

            // Department-wise stats
            const departmentStats = await query(
                `SELECT 
           s.department,
           COUNT(DISTINCT s.id) as total_students,
           COUNT(DISTINCT CASE 
             WHEN a.overall_status IN ('SELECTED', 'OFFER_ACCEPTED') 
             THEN s.id 
           END) as placed_students,
           AVG(CASE 
             WHEN o.status = 'ACCEPTED' 
             THEN o.ctc 
           END) as average_ctc
         FROM students s
         LEFT JOIN applications a ON s.id = a.student_id
         LEFT JOIN offers o ON a.id = o.application_id
         GROUP BY s.department
         ORDER BY s.department`
            );

            const departmentData = departmentStats.rows.map(row => ({
                department: row.department,
                totalStudents: parseInt(row.total_students),
                placedStudents: parseInt(row.placed_students),
                placementPercentage: parseInt(row.total_students) > 0
                    ? (parseInt(row.placed_students) / parseInt(row.total_students)) * 100
                    : 0,
                averageCTC: parseFloat(row.average_ctc) || 0
            }));

            // Company performance stats
            const companyStats = await query(
                `SELECT 
           c.company_name,
           COUNT(DISTINCT a.id) as applicants,
           COUNT(DISTINCT CASE 
             WHEN a.current_round > 0 
             THEN a.id 
           END) as shortlisted,
           COUNT(DISTINCT CASE 
             WHEN a.overall_status IN ('SELECTED', 'OFFER_ACCEPTED') 
             THEN a.id 
           END) as selected,
           AVG(CASE 
             WHEN a.overall_status = 'SELECTED' 
             THEN a.current_round 
           END) as avg_rounds_to_hire
         FROM companies c
         LEFT JOIN placement_drives pd ON c.id = pd.company_id
         LEFT JOIN applications a ON pd.id = a.drive_id
         GROUP BY c.id, c.company_name
         HAVING COUNT(a.id) > 0
         ORDER BY selected DESC`
            );

            const companyData = companyStats.rows.map(row => ({
                companyName: row.company_name,
                applicants: parseInt(row.applicants),
                shortlisted: parseInt(row.shortlisted),
                selected: parseInt(row.selected),
                conversionRate: parseInt(row.applicants) > 0
                    ? (parseInt(row.selected) / parseInt(row.applicants)) * 100
                    : 0,
                averageRoundsToHire: parseFloat(row.avg_rounds_to_hire) || 0
            }));

            // Round dropoff analysis
            const roundDropoff = await query(
                `SELECT 
           sr.round_number,
           sr.round_name,
           COUNT(*) as entered,
           COUNT(*) FILTER (WHERE sr.status = 'SELECTED') as cleared
         FROM shortlist_rounds sr
         GROUP BY sr.round_number, sr.round_name
         ORDER BY sr.round_number`
            );

            const roundData = roundDropoff.rows.map(row => ({
                roundNumber: row.round_number,
                roundName: row.round_name || `Round ${row.round_number}`,
                entered: parseInt(row.entered),
                cleared: parseInt(row.cleared),
                dropoffRate: parseInt(row.entered) > 0
                    ? ((parseInt(row.entered) - parseInt(row.cleared)) / parseInt(row.entered)) * 100
                    : 0
            }));

            return {
                totalStudents,
                placedStudents,
                placementPercentage,
                totalDrives: parseInt(driveStats.rows[0].total_drives),
                activeDrives: parseInt(driveStats.rows[0].active_drives),
                completedDrives: parseInt(driveStats.rows[0].completed_drives),
                totalApplications,
                averageApplicationsPerStudent,
                totalOffers,
                offersAccepted,
                offersPending,
                acceptanceRate,
                multipleOfferStudents,
                departmentStats: departmentData,
                companyStats: companyData,
                roundDropoff: roundData
            };
        } catch (error) {
            console.error('Error getting overall analytics:', error);
            throw error;
        }
    }

    /**
     * Broadcast analytics update to all admin users
     */
    async broadcastAnalyticsUpdate(): Promise<void> {
        try {
            const analytics = await this.getOverallAnalytics();

            const payload: AnalyticsUpdatePayload = {
                totalDrives: analytics.totalDrives,
                activeDrives: analytics.activeDrives,
                totalApplications: analytics.totalApplications,
                totalStudents: analytics.totalStudents,
                placedStudents: analytics.placedStudents,
                placementPercentage: analytics.placementPercentage,
                departmentStats: analytics.departmentStats.map(d => ({
                    department: d.department,
                    totalStudents: d.totalStudents,
                    placedStudents: d.placedStudents,
                    percentage: d.placementPercentage,
                    averageCTC: d.averageCTC
                })),
                companyStats: analytics.companyStats.map(c => ({
                    companyName: c.companyName,
                    applicants: c.applicants,
                    shortlisted: c.shortlisted,
                    selected: c.selected,
                    conversionRate: c.conversionRate
                })),
                updatedAt: new Date().toISOString()
            };

            const io = getIO();
            io.to('role:ADMIN').emit(SocketEvent.ANALYTICS_UPDATE, payload);

            console.log('✅ Analytics update broadcasted to admins');
        } catch (error) {
            console.error('Error broadcasting analytics update:', error);
        }
    }

    /**
     * Get department-wise analytics
     */
    async getDepartmentAnalytics(department: string) {
        try {
            const result = await query(
                `SELECT 
           COUNT(DISTINCT s.id) as total_students,
           COUNT(DISTINCT CASE 
             WHEN a.overall_status IN ('SELECTED', 'OFFER_ACCEPTED') 
             THEN s.id 
           END) as placed_students,
           COUNT(DISTINCT a.id) as total_applications,
           AVG(CASE 
             WHEN o.status = 'ACCEPTED' 
             THEN o.ctc 
           END) as average_ctc,
           MAX(CASE 
             WHEN o.status = 'ACCEPTED' 
             THEN o.ctc 
           END) as highest_ctc
         FROM students s
         LEFT JOIN applications a ON s.id = a.student_id
         LEFT JOIN offers o ON a.id = o.application_id
         WHERE s.department = $1`,
                [department]
            );

            return result.rows[0];
        } catch (error) {
            console.error('Error getting department analytics:', error);
            throw error;
        }
    }

    /**
     * Get company-wise analytics
     */
    async getCompanyAnalytics(companyId: string) {
        try {
            const result = await query(
                `SELECT 
           COUNT(DISTINCT pd.id) as total_drives,
           COUNT(DISTINCT a.id) as total_applicants,
           COUNT(DISTINCT CASE 
             WHEN a.overall_status IN ('SELECTED', 'OFFER_ACCEPTED') 
             THEN a.id 
           END) as selected_candidates,
           COUNT(DISTINCT o.id) as offers_made,
           COUNT(DISTINCT CASE 
             WHEN o.status = 'ACCEPTED' 
             THEN o.id 
           END) as offers_accepted
         FROM companies c
         LEFT JOIN placement_drives pd ON c.id = pd.company_id
         LEFT JOIN applications a ON pd.id = a.drive_id
         LEFT JOIN offers o ON a.id = o.application_id
         WHERE c.id = $1`,
                [companyId]
            );

            return result.rows[0];
        } catch (error) {
            console.error('Error getting company analytics:', error);
            throw error;
        }
    }
}

export default new AnalyticsService();
