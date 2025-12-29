import express from 'express';
import { protect } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import User from '../models/User.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'profilePhoto') {
            cb(null, 'uploads/profiles/');
        } else if (file.fieldname === 'resume') {
            cb(null, 'uploads/resumes/');
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'profilePhoto') {
        // Allow only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for profile photo'), false);
        }
    } else if (file.fieldname === 'resume') {
        // Allow only PDFs and DOC files
        if (file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/msword' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and DOC files are allowed for resume'), false);
        }
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// @route   GET /api/profile
// @desc    Get user profile
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -refreshToken');
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put('/', protect, async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            address,
            department,
            cgpa,
            skills,
            linkedIn,
            github,
            portfolio,
            emailPreferences
        } = req.body;

        const updateFields = {};
        if (name) updateFields.name = name;
        if (email) updateFields.email = email;
        if (phone) updateFields.phone = phone;
        if (address) updateFields.address = address;
        if (department) updateFields.department = department;
        if (cgpa !== undefined) updateFields.cgpa = cgpa;
        if (skills) updateFields.skills = skills;
        if (linkedIn) updateFields.linkedIn = linkedIn;
        if (github) updateFields.github = github;
        if (portfolio) updateFields.portfolio = portfolio;
        if (emailPreferences) updateFields.emailPreferences = emailPreferences;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password -refreshToken');

        res.json({ success: true, data: user, message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   POST /api/profile/photo
// @desc    Upload profile photo
// @access  Private
router.post('/photo', protect, upload.single('profilePhoto'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { profilePhoto: `/uploads/profiles/${req.file.filename}` } },
            { new: true }
        ).select('-password -refreshToken');

        res.json({
            success: true,
            data: user,
            photoUrl: user.profilePhoto,
            message: 'Profile photo uploaded successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   POST /api/profile/resume
// @desc    Upload resume
// @access  Private
router.post('/resume', protect, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { resumeUrl: `/uploads/resumes/${req.file.filename}` } },
            { new: true }
        ).select('-password -refreshToken');

        res.json({
            success: true,
            data: user,
            resumeUrl: user.resumeUrl,
            message: 'Resume uploaded successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/profile/resume
// @desc    Delete resume
// @access  Private
router.delete('/resume', protect, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $unset: { resumeUrl: 1 } },
            { new: true }
        ).select('-password -refreshToken');

        res.json({ success: true, data: user, message: 'Resume deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

export default router;
