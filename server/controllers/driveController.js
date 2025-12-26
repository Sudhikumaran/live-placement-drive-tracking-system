import PlacementDrive from '../models/PlacementDrive.js';
import Application from '../models/Application.js';
import xlsx from 'xlsx';

// Create new placement drive (Admin only)
export const createDrive = async (req, res) => {
    try {
        const { companyName, role, description, eligibility, rounds, ctc, location, deadline, status } = req.body;

        const drive = await PlacementDrive.create({
            companyName,
            role,
            description,
            eligibility,
            rounds,
            status: status || 'upcoming',
            ctc,
            location,
            deadline,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Placement drive created successfully',
            drive
        });
    } catch (error) {
        console.error('Create drive error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create placement drive',
            error: error.message
        });
    }
};

// Get all placement drives
export const getAllDrives = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};

        if (status) {
            filter.status = status;
        }

        const drives = await PlacementDrive.find(filter)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        // For students, filter by eligibility
        let filteredDrives = drives;
        if (req.user.role === 'student') {
            filteredDrives = drives.filter(drive => {
                const meetsGPA = req.user.cgpa >= drive.eligibility.minCgpa;
                const meetsDepartment = drive.eligibility.departments.includes(req.user.department);
                return meetsGPA && meetsDepartment;
            });
        }

        res.status(200).json({
            success: true,
            count: filteredDrives.length,
            drives: filteredDrives
        });
    } catch (error) {
        console.error('Get drives error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch placement drives',
            error: error.message
        });
    }
};

// Get single drive by ID
export const getDriveById = async (req, res) => {
    try {
        const drive = await PlacementDrive.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!drive) {
            return res.status(404).json({
                success: false,
                message: 'Placement drive not found'
            });
        }

        res.status(200).json({
            success: true,
            drive
        });
    } catch (error) {
        console.error('Get drive error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch placement drive',
            error: error.message
        });
    }
};

// Update placement drive (Admin only)
export const updateDrive = async (req, res) => {
    try {
        const drive = await PlacementDrive.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!drive) {
            return res.status(404).json({
                success: false,
                message: 'Placement drive not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Placement drive updated successfully',
            drive
        });
    } catch (error) {
        console.error('Update drive error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update placement drive',
            error: error.message
        });
    }
};

// Delete placement drive (Admin only)
export const deleteDrive = async (req, res) => {
    try {
        const drive = await PlacementDrive.findByIdAndDelete(req.params.id);

        if (!drive) {
            return res.status(404).json({
                success: false,
                message: 'Placement drive not found'
            });
        }

        // Also delete all applications for this drive
        await Application.deleteMany({ driveId: req.params.id });

        res.status(200).json({
            success: true,
            message: 'Placement drive deleted successfully'
        });
    } catch (error) {
        console.error('Delete drive error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete placement drive',
            error: error.message
        });
    }
};

// Upload shortlist via Excel (Admin only)
export const uploadShortlist = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an Excel file'
            });
        }

        const { driveId, round } = req.body;

        if (!driveId || !round) {
            return res.status(400).json({
                success: false,
                message: 'Drive ID and round are required'
            });
        }

        // Parse Excel file
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const updates = [];
        const notifiedStudents = [];

        // Process each row
        for (const row of data) {
            const email = row.email || row.Email;
            const status = row.status || row.Status;

            if (!email || !status) continue;

            // Find application by student email and drive ID
            const application = await Application.findOne({ driveId })
                .populate('studentId');

            if (application && application.studentId.email === email.toLowerCase()) {
                // Update round status
                const existingRound = application.roundStatus.find(r => r.round === round);

                if (existingRound) {
                    existingRound.status = status.toLowerCase();
                    existingRound.updatedAt = Date.now();
                } else {
                    application.roundStatus.push({
                        round,
                        status: status.toLowerCase(),
                        updatedAt: Date.now()
                    });
                }

                // Update final status
                if (status.toLowerCase() === 'selected') {
                    application.finalStatus = 'selected';
                } else if (status.toLowerCase() === 'rejected') {
                    application.finalStatus = 'rejected';
                } else {
                    application.finalStatus = 'in-progress';
                }

                await application.save();
                updates.push({ email, status });
                notifiedStudents.push(application.studentId._id);
            }
        }

        // Emit socket event for real-time notification
        if (req.io && notifiedStudents.length > 0) {
            notifiedStudents.forEach(studentId => {
                req.io.to(`user_${studentId}`).emit('shortlist_update', {
                    driveId,
                    round,
                    message: 'Your application status has been updated'
                });
            });
        }

        res.status(200).json({
            success: true,
            message: `Successfully updated ${updates.length} applications`,
            updates
        });
    } catch (error) {
        console.error('Upload shortlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload shortlist',
            error: error.message
        });
    }
};
