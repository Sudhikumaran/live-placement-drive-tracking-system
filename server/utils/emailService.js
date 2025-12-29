import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
};

// Email templates
const emailTemplates = {
    shortlistUpdate: (studentName, driveName, round, status) => ({
        subject: `Shortlist Update: ${driveName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0  0 10px 10px; }
                    .status { padding: 15px; margin: 20px 0; border-radius: 8px; font-weight: bold; text-align: center; }
                    .status.shortlisted { background: #d1f4e0; color: #0f7842; }
                    .status.rejected { background: #fde8e8; color: #c53030; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                   .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Placement Drive Update</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${studentName},</p>
                        <p>We have an update regarding your application for <strong>${driveName}</strong>.</p>
                        <div class="status ${status.toLowerCase()}">
                            Round: ${round}<br>
                            Status: ${status.toUpperCase()}
                        </div>
                        <p>${status.toLowerCase() === 'shortlisted'
                ? 'Congratulations! You have been shortlisted for the next round. Please check your dashboard for more details.'
                : 'Unfortunately, you were not selected for this round. Keep applying and good luck with future opportunities!'
            }</p>
                        <a href="${process.env.CLIENT_URL}/student/applications" class="btn">View My Applications</a>
                        <p style="margin-top: 30px;">Best regards,<br>Placement Cell</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this message.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `Dear ${studentName},\n\nWe have an update regarding your application for ${driveName}.\n\nRound: ${round}\nStatus: ${status.toUpperCase()}\n\n${status.toLowerCase() === 'shortlisted'
            ? 'Congratulations! You have been shortlisted for the next round.'
            : 'Unfortunately, you were not selected for this round.'
            }\n\nBest regards,\nPlacement Cell`
    }),

    newDriveAnnouncement: (studentName, driveName, companyName, deadline) => ({
        subject: `New Placement Drive: ${companyName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .highlight { background: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107; border-radius: 4px; }
                    .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎯 New Placement Opportunity!</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${studentName},</p>
                        <p>A new placement drive has been announced!</p>
                        <div class="highlight">
                            <h3 style="margin-top: 0;">${companyName}</h3>
                            <p><strong>Role:</strong> ${driveName}</p>
                            <p><strong>Application Deadline:</strong> ${new Date(deadline).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}</p>
                        </div>
                        <p>Don't miss this opportunity! Apply now to be considered for this position.</p>
                        <a href="${process.env.CLIENT_URL}/student/drives" class="btn">View Details & Apply</a>
                        <p style="margin-top: 30px;">Best regards,<br>Placement Cell</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this message.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `Dear ${studentName},\n\nA new placement drive has been announced!\n\nCompany: ${companyName}\nRole: ${driveName}\nApplication Deadline: ${new Date(deadline).toLocaleDateString()}\n\nDon't miss this opportunity! Visit ${process.env.CLIENT_URL}/student/drives to apply.\n\nBest regards,\nPlacement Cell`
    }),

    applicationConfirmation: (studentName, driveName, companyName) => ({
        subject: `Application Confirmed: ${companyName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .success { background: #d1f4e0; padding: 15px; margin: 20px 0; border-left: 4px solid #0f7842; border-radius: 4px; color: #0f7842; font-weight: bold; }
                    .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <  <div class="header">
                        <h1>✅ Application Submitted Successfully!</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${studentName},</p>
                        <div class="success">
                            Your application has been successfully submitted!
                        </div>
                        <p>You have successfully applied for the following position:</p>
                        <p><strong>Company:</strong> ${companyName}<br>
                        <strong>Role:</strong> ${driveName}</p>
                        <p>We will notify you about any updates regarding your application status.</p>
                        <a href="${process.env.CLIENT_URL}/student/applications" class="btn">Track Your Application</a>
                        <p style="margin-top: 30px;">Best of luck!<br>Placement Cell</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this message.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `Dear ${studentName},\n\nYour application has been successfully submitted!\n\nCompany: ${companyName}\nRole: ${driveName}\n\nWe will notify you about any updates regarding your application status.\n\nBest of luck!\nPlacement Cell`
    })
};

// Send email function
export const sendEmail = async (to, templateName, templateData) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.warn('Email credentials not configured. Skipping email send.');
            return { success: false, message: 'Email not configured' };
        }

        const transporter = createTransporter();
        const template = emailTemplates[templateName];

        if (!template) {
            throw new Error(`Email template '${templateName}' not found`);
        }

        const emailContent = template(...templateData);

        const mailOptions = {
            from: `"Placement Tracker" <${process.env.EMAIL_USER}>`,
            to,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}: ${info.messageId}`);

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

// Convenience functions for specific email types
export const sendShortlistEmail = async (userEmail, studentName, driveName, round, status) => {
    return await sendEmail(userEmail, 'shortlistUpdate', [studentName, driveName, round, status]);
};

export const sendDriveAnnouncementEmail = async (userEmail, studentName, driveName, companyName, deadline) => {
    return await sendEmail(userEmail, 'newDriveAnnouncement', [studentName, driveName, companyName, deadline]);
};

export const sendApplicationConfirmationEmail = async (userEmail, studentName, driveName, companyName) => {
    return await sendEmail(userEmail, 'applicationConfirmation', [studentName, driveName, companyName]);
};

export default { sendEmail, sendShortlistEmail, sendDriveAnnouncementEmail, sendApplicationConfirmationEmail };
