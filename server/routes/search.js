import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import PlacementDrive from '../models/PlacementDrive.js';
import User from '../models/User.js';
import Application from '../models/Application.js';

const router = express.Router();

// @route   GET /api/search
// @desc    Global search across drives, companies, and students
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const searchRegex = new RegExp(q, 'i'); // Case-insensitive search

        // Search in drives
        const drives = await PlacementDrive.find({
            $or: [
                { companyName: searchRegex },
                { role: searchRegex },
                { description: searchRegex },
                { location: searchRegex }
            ]
        }).limit(10).select('companyName role ctc location status deadline');

        let students = [];
        // Only admins can search for students
        if (req.user.role === 'admin') {
            students = await User.find({
                role: 'student',
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { department: searchRegex }
                ]
            }).limit(10).select('name email department cgpa');
        }

        const results = {
            drives: drives.map(drive => ({
                id: drive._id,
                type: 'drive',
                title: `${drive.companyName} - ${drive.role}`,
                subtitle: `${drive.ctc} | ${drive.location}`,
                status: drive.status,
                deadline: drive.deadline
            })),
            students: students.map(student => ({
                id: student._id,
                type: 'student',
                title: student.name,
                subtitle: `${student.email} | ${student.department} | CGPA: ${student.cgpa || 'N/A'}`,
                department: student.department
            }))
        };

        res.json({
            success: true,
            data: results,
            total: results.drives.length + results.students.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

export default router;
