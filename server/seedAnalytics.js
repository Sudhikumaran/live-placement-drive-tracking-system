import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import PlacementDrive from './models/PlacementDrive.js';
import Application from './models/Application.js';

dotenv.config();

const seedAnalytics = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create sample students
        const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil'];
        const students = [];

        for (let dept of departments) {
            for (let i = 1; i <= 30; i++) {
                const student = new User({
                    name: `Student ${i} - ${dept}`,
                    email: `student${dept.toLowerCase().replace(' ', '')}${i}@college.edu`,
                    password: 'password123',
                    role: 'student',
                    department: dept,
                    cgpa: (7.5 + Math.random() * 2.5).toFixed(2),
                    skills: ['JavaScript', 'React', 'Node.js'],
                    resumeUrl: null
                });
                students.push(await student.save());
            }
        }

        console.log(`Created ${students.length} students`);

        // Get an admin user to be the creator
        const adminUser = await User.findOne({ role: 'admin' });

        // Create sample placement drives
        const companies = [
            { name: 'TCS', role: 'Software Engineer', ctc: '6.5 LPA' },
            { name: 'Infosys', role: 'System Engineer', ctc: '5.5 LPA' },
            { name: 'Wipro', role: 'Project Engineer', ctc: '5.0 LPA' },
            { name: 'Google', role: 'Software Engineer', ctc: '45 LPA' },
            { name: 'Microsoft', role: 'Software Engineer', ctc: '42 LPA' }
        ];

        const drives = [];

        for (let company of companies) {
            const drive = new PlacementDrive({
                companyName: company.name,
                role: company.role,
                description: `Recruitment drive for ${company.name}`,
                ctc: company.ctc,
                eligibility: {
                    minCgpa: 7.0,
                    departments: departments
                },
                location: 'Online',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                rounds: [
                    { name: 'Online Test', date: new Date() },
                    { name: 'Technical Interview', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
                ],
                status: 'ongoing',
                createdBy: adminUser._id
            });
            drives.push(await drive.save());
        }

        console.log(`Created ${drives.length} placement drives`);

        // Create sample applications
        let applicationsCreated = 0;

        for (let drive of drives) {
            // 60-80 students apply per drive
            const applicantsCount = Math.floor(Math.random() * 20) + 60;
            const selectedIndices = new Set();

            // Randomly select 10-15 students to be placed
            const selectedCount = Math.floor(Math.random() * 5) + 10;
            while (selectedIndices.size < selectedCount) {
                selectedIndices.add(Math.floor(Math.random() * students.length));
            }

            for (let i = 0; i < applicantsCount; i++) {
                const studentIdx = Math.floor(Math.random() * students.length);
                const student = students[studentIdx];

                const isSelected = selectedIndices.has(studentIdx);

                const application = new Application({
                    studentId: student._id,
                    driveId: drive._id,
                    status: 'submitted',
                    finalStatus: isSelected ? 'selected' : 'rejected',
                    roundStatus: [
                        {
                            round: 'Online Test',
                            status: 'cleared'
                        },
                        {
                            round: 'Technical Interview',
                            status: isSelected ? 'cleared' : 'rejected'
                        }
                    ],
                    appliedAt: new Date(),
                    updatedAt: new Date()
                });

                await application.save();
                applicationsCreated++;
            }
        }

        console.log(`Created ${applicationsCreated} applications`);

        console.log('Analytics data seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedAnalytics();
