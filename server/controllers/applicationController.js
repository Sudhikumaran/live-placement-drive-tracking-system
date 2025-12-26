import Application from '../models/Application.js';
import PlacementDrive from '../models/PlacementDrive.js';
import User from '../models/User.js';

// Apply to a placement drive (Student only)
export const applyToDrive = async (req, res) => {
    try {
        const { driveId } = req.body;
        const studentId = req.user.id;

        // Check if drive exists
        const drive = await PlacementDrive.findById(driveId);
        if (!drive) {
            return res.status(404).json({
                success: false,
                message: 'Placement drive not found'
            });
        }

        // Check eligibility
        const student = await User.findById(studentId);
        const meetsGPA = student.cgpa >= drive.eligibility.minCgpa;
        const meetsDepartment = drive.eligibility.departments.includes(student.department);

        if (!meetsGPA || !meetsDepartment) {
            return res.status(403).json({
                success: false,
                message: 'You do not meet the eligibility criteria for this drive'
            });
        }

        // Check if already applied
        const existingApplication = await Application.findOne({ studentId, driveId });
        if (existingApplication) {
            return res.status(409).json({
                success: false,
                message: 'You have already applied to this drive'
            });
        }

        // Check deadline
        if (new Date() > new Date(drive.deadline)) {
            return res.status(400).json({
                success: false,
                message: 'Application deadline has passed'
            });
        }

        // Create application
        const application = await Application.create({
            studentId,
            driveId,
            finalStatus: 'applied'
        });

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application
        });
    } catch (error) {
        console.error('Apply to drive error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit application',
            error: error.message
        });
    }
};

// Get all applications for a student
export const getStudentApplications = async (req, res) => {
    try {
        const studentId = req.params.id;

        // Check authorization
        if (req.user.role === 'student' && req.user.id !== studentId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view these applications'
            });
        }

        const applications = await Application.find({ studentId })
            .populate('driveId')
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            count: applications.length,
            applications
        });
    } catch (error) {
        console.error('Get student applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications',
            error: error.message
        });
    }
};

// Get all applications for a drive (Admin only)
export const getDriveApplications = async (req, res) => {
    try {
        const driveId = req.params.id;

        const applications = await Application.find({ driveId })
            .populate('studentId', 'name email department cgpa')
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            count: applications.length,
            applications
        });
    } catch (error) {
        console.error('Get drive applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications',
            error: error.message
        });
    }
};

// Update round status (Admin only)
export const updateRoundStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { round, status } = req.body;

        const application = await Application.findById(applicationId)
            .populate('studentId');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Update or add round status
        const existingRound = application.roundStatus.find(r => r.round === round);

        if (existingRound) {
            existingRound.status = status;
            existingRound.updatedAt = Date.now();
        } else {
            application.roundStatus.push({
                round,
                status,
                updatedAt: Date.now()
            });
        }

        // Update final status
        if (status === 'selected') {
            application.finalStatus = 'selected';
        } else if (status === 'rejected') {
            application.finalStatus = 'rejected';
        } else {
            application.finalStatus = 'in-progress';
        }

        await application.save();

        // Emit socket event for real-time notification
        if (req.io) {
            req.io.to(`user_${application.studentId._id}`).emit('status_update', {
                applicationId: application._id,
                round,
                status,
                message: `Your status for ${round} has been updated to ${status}`
            });
        }

        res.status(200).json({
            success: true,
            message: 'Round status updated successfully',
            application
        });
    } catch (error) {
        console.error('Update round status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update round status',
            error: error.message
        });
    }
};

// Get my applications (currently logged in student)
export const getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({ studentId: req.user.id })
            .populate('driveId')
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            count: applications.length,
            applications
        });
    } catch (error) {
        console.error('Get my applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications',
            error: error.message
        });
    }
};
