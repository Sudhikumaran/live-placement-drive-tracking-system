import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import PlacementDrive from '../models/PlacementDrive.js';
import Application from '../models/Application.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/export/drives/excel
// @desc    Export drives to Excel
// @access  Private (Admin only)
router.get('/drives/excel', protect, authorize('admin'), async (req, res) => {
    try {
        const drives = await PlacementDrive.find().populate('createdBy', 'name email');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Placement Drives');

        // Define columns
        worksheet.columns = [
            { header: 'Company Name', key: 'companyName', width: 20 },
            { header: 'Role', key: 'role', width: 20 },
            { header: 'CTC', key: 'ctc', width: 15 },
            { header: ' Location', key: 'location', width: 15 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Job Type', key: 'jobType', width: 15 },
            { header: 'Min CGPA', key: 'minCgpa', width: 10 },
            { header: 'Departments', key: 'departments', width: 30 },
            { header: 'Deadline', key: 'deadline', width: 15 },
            { header: 'Created By', key: 'createdBy', width: 20 },
            { header: 'Created At', key: 'createdAt', width: 15 },
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' }
        };
        worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        // Add data
        drives.forEach(drive => {
            worksheet.addRow({
                companyName: drive.companyName,
                role: drive.role,
                ctc: drive.ctc,
                location: drive.location,
                status: drive.status,
                jobType: drive.jobType,
                minCgpa: drive.eligibility.minCgpa,
                departments: drive.eligibility.departments.join(', '),
                deadline: new Date(drive.deadline).toLocaleDateString(),
                createdBy: drive.createdBy?.name || 'N/A',
                createdAt: new Date(drive.createdAt).toLocaleDateString()
            });
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=placement-drives-${Date.now()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error exporting drives',
            error: error.message
        });
    }
});

// @route   GET /api/export/applications/excel
// @desc    Export applications to Excel
// @access  Private (Admin only)
router.get('/applications/excel', protect, authorize('admin'), async (req, res) => {
    try {
        const applications = await Application.find()
            .populate('studentId', 'name email department cgpa')
            .populate('driveId', 'companyName role');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Applications');

        worksheet.columns = [
            { header: 'Student Name', key: 'studentName', width: 20 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Department', key: 'department', width: 15 },
            { header: 'CGPA', key: 'cgpa', width: 10 },
            { header: 'Company', key: 'company', width: 20 },
            { header: 'Role', key: 'role', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Applied At', key: 'appliedAt', width: 15 },
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' }
        };
        worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        // Add data
        applications.forEach(app => {
            worksheet.addRow({
                studentName: app.studentId?.name || 'N/A',
                email: app.studentId?.email || 'N/A',
                department: app.studentId?.department || 'N/A',
                cgpa: app.studentId?.cgpa || 'N/A',
                company: app.driveId?.companyName || 'N/A',
                role: app.driveId?.role || 'N/A',
                status: app.finalStatus,
                appliedAt: new Date(app.appliedAt).toLocaleDateString()
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=applications-${Date.now()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error exporting applications',
            error: error.message
        });
    }
});

// @route   GET /api/export/analytics/pdf
// @desc    Export analytics report as PDF
// @access  Private (Admin only)
router.get('/analytics/pdf', protect, authorize('admin'), async (req, res) => {
    try {
        const totalDrives = await PlacementDrive.countDocuments();
        const totalApplications = await Application.countDocuments();
        const totalStudents = await User.countDocuments({ role: 'student' });
        const selectedStudents = await Application.countDocuments({ finalStatus: 'selected' });

        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-report-${Date.now()}.pdf`);

        doc.pipe(res);

        // Title
        doc.fontSize(24).fillColor('#4F46E5').text('Placement Analytics Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).fillColor('#666').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);

        // Summary Statistics
        doc.fontSize(18).fillColor('#000').text('Summary Statistics');
        doc.moveDown();

        const stats = [
            ['Total Placement Drives', totalDrives],
            ['Total Applications', totalApplications],
            ['Total Students', totalStudents],
            ['Selected Students', selectedStudents],
            ['Selection Rate', totalApplications > 0 ? `${((selectedStudents / totalApplications) * 100).toFixed(2)}%` : 'N/A']
        ];

        stats.forEach(([label, value]) => {
            doc.fontSize(12).fillColor('#333').text(`${label}:`, { continued: true });
            doc.fillColor('#4F46E5').text(` ${value}`, { align: 'left' });
            doc.moveDown(0.5);
        });

        doc.moveDown(2);

        // Recent Drives
        doc.fontSize(18).fillColor('#000').text('Recent Placement Drives');
        doc.moveDown();

        const recentDrives = await PlacementDrive.find().sort({ createdAt: -1 }).limit(10);

        recentDrives.forEach((drive, index) => {
            doc.fontSize(12).fillColor('#4F46E5').text(`${index + 1}. ${drive.companyName} - ${drive.role}`);
            doc.fontSize(10).fillColor('#666').text(`   CTC: ${drive.ctc} | Location: ${drive.location} | Status: ${drive.status}`);
            doc.moveDown(0.5);
        });

        doc.end();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error exporting analytics',
            error: error.message
        });
    }
});

export default router;
