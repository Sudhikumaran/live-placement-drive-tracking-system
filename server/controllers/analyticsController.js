import Application from '../models/Application.js';
import PlacementDrive from '../models/PlacementDrive.js';
import User from '../models/User.js';

// Get overall placement statistics
export const getPlacementStats = async (req, res) => {
    try {
        // Get placement stats by department
        const departments = await User.distinct('department', { role: 'student' });

        const departmentStats = await Promise.all(
            departments.map(async (dept) => {
                const totalStudents = await User.countDocuments({
                    role: 'student',
                    department: dept
                });

                const placedStudents = await Application.countDocuments({
                    finalStatus: 'selected',
                    studentId: { $in: await User.find({ department: dept }).distinct('_id') }
                });

                return {
                    department: dept,
                    total: totalStudents,
                    placed: placedStudents,
                    percentage: totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(2) : 0
                };
            })
        );

        res.status(200).json({
            success: true,
            stats: departmentStats
        });
    } catch (error) {
        console.error('Get placement stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch placement statistics',
            error: error.message
        });
    }
};

// Get company-wise offer statistics
export const getCompanyStats = async (req, res) => {
    try {
        const drives = await PlacementDrive.find();

        const companyStats = await Promise.all(
            drives.map(async (drive) => {
                const offers = await Application.countDocuments({
                    driveId: drive._id,
                    finalStatus: 'selected'
                });

                return {
                    company: drive.companyName,
                    role: drive.role,
                    offers,
                    ctc: drive.ctc
                };
            })
        );

        // Sort by offers count
        companyStats.sort((a, b) => b.offers - a.offers);

        res.status(200).json({
            success: true,
            stats: companyStats
        });
    } catch (error) {
        console.error('Get company stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch company statistics',
            error: error.message
        });
    }
};

// Get round-wise elimination statistics
export const getRoundStats = async (req, res) => {
    try {
        const { driveId } = req.query;

        if (!driveId) {
            return res.status(400).json({
                success: false,
                message: 'Drive ID is required'
            });
        }

        const applications = await Application.find({ driveId });

        // Aggregate round-wise stats
        const roundStats = {};

        applications.forEach(app => {
            app.roundStatus.forEach(rs => {
                if (!roundStats[rs.round]) {
                    roundStats[rs.round] = {
                        round: rs.round,
                        shortlisted: 0,
                        rejected: 0,
                        pending: 0,
                        selected: 0
                    };
                }
                roundStats[rs.round][rs.status]++;
            });
        });

        res.status(200).json({
            success: true,
            stats: Object.values(roundStats)
        });
    } catch (error) {
        console.error('Get round stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch round statistics',
            error: error.message
        });
    }
};

// Get overall student statistics
export const getStudentStats = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalApplications = await Application.countDocuments();
        const placedStudents = await Application.distinct('studentId', {
            finalStatus: 'selected'
        });
        const inProgressStudents = await Application.distinct('studentId', {
            finalStatus: 'in-progress'
        });

        res.status(200).json({
            success: true,
            stats: {
                totalStudents,
                totalApplications,
                placedCount: placedStudents.length,
                inProgressCount: inProgressStudents.length,
                notAppliedCount: totalStudents - new Set([...placedStudents, ...inProgressStudents]).size,
                placementPercentage: totalStudents > 0 ?
                    ((placedStudents.length / totalStudents) * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        console.error('Get student stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student statistics',
            error: error.message
        });
    }
};

// Get dashboard overview (Admin)
export const getDashboardOverview = async (req, res) => {
    try {
        const totalDrives = await PlacementDrive.countDocuments();
        const activeDrives = await PlacementDrive.countDocuments({
            status: { $in: ['upcoming', 'ongoing'] }
        });
        const totalApplications = await Application.countDocuments();
        const totalStudents = await User.countDocuments({ role: 'student' });
        const placedStudents = await Application.distinct('studentId', {
            finalStatus: 'selected'
        });

        // Recent activities
        const recentApplications = await Application.find()
            .populate('studentId', 'name email')
            .populate('driveId', 'companyName role')
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            overview: {
                totalDrives,
                activeDrives,
                totalApplications,
                totalStudents,
                placedCount: placedStudents.length,
                placementPercentage: totalStudents > 0 ?
                    ((placedStudents.length / totalStudents) * 100).toFixed(2) : 0
            },
            recentActivities: recentApplications
        });
    } catch (error) {
        console.error('Get dashboard overview error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard overview',
            error: error.message
        });
    }
};
