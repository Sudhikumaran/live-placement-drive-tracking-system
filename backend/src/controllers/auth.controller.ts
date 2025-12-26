import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import {
    RegisterStudentRequest,
    RegisterCompanyRequest,
    RegisterAdminRequest,
    LoginRequest,
    AuthRequest
} from '../types';
import { UserRole } from '../sockets/types';

// Generate JWT token
const generateToken = (id: string, email: string, role: UserRole): string => {
    return jwt.sign(
        { id, email, role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Register Student
export const registerStudent = async (req: Request, res: Response) => {
    try {
        const {
            email,
            password,
            fullName,
            rollNumber,
            department,
            cgpa,
            graduationYear
        } = req.body as RegisterStudentRequest;

        // Validate input
        if (!email || !password || !fullName || !rollNumber || !department || !graduationYear) {
            return res.status(400).json({
                success: false,
                error: 'All required fields must be provided'
            });
        }

        // Check if student already exists
        const existing = await query(
            'SELECT id FROM students WHERE email = $1 OR roll_number = $2',
            [email, rollNumber]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Student with this email or roll number already exists'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert student
        const result = await query(
            `INSERT INTO students (email, password_hash, full_name, roll_number, department, cgpa, graduation_year)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, full_name, roll_number, department, cgpa, graduation_year`,
            [email, passwordHash, fullName, rollNumber, department, cgpa, graduationYear]
        );

        const student = result.rows[0];

        // Generate token
        const token = generateToken(student.id, student.email, UserRole.STUDENT);

        res.status(201).json({
            success: true,
            message: 'Student registered successfully',
            token,
            user: {
                id: student.id,
                email: student.email,
                role: UserRole.STUDENT,
                name: student.full_name
            }
        });
    } catch (error) {
        console.error('Register student error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register student'
        });
    }
};

// Register Company
export const registerCompany = async (req: Request, res: Response) => {
    try {
        const {
            email,
            password,
            companyName,
            industry,
            website,
            hrContactName,
            hrContactPhone
        } = req.body as RegisterCompanyRequest;

        // Validate input
        if (!email || !password || !companyName) {
            return res.status(400).json({
                success: false,
                error: 'Email, password, and company name are required'
            });
        }

        // Check if company already exists
        const existing = await query(
            'SELECT id FROM companies WHERE email = $1',
            [email]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Company with this email already exists'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert company
        const result = await query(
            `INSERT INTO companies (email, password_hash, company_name, industry, website, hr_contact_name, hr_contact_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, company_name, industry, website`,
            [email, passwordHash, companyName, industry, website, hrContactName, hrContactPhone]
        );

        const company = result.rows[0];

        // Generate token
        const token = generateToken(company.id, company.email, UserRole.COMPANY);

        res.status(201).json({
            success: true,
            message: 'Company registered successfully',
            token,
            user: {
                id: company.id,
                email: company.email,
                role: UserRole.COMPANY,
                name: company.company_name
            }
        });
    } catch (error) {
        console.error('Register company error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register company'
        });
    }
};

// Register Admin
export const registerAdmin = async (req: Request, res: Response) => {
    try {
        const { email, password, fullName } = req.body as RegisterAdminRequest;

        // Validate input
        if (!email || !password || !fullName) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        // Check if admin already exists
        const existing = await query(
            'SELECT id FROM admins WHERE email = $1',
            [email]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Admin with this email already exists'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert admin
        const result = await query(
            `INSERT INTO admins (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, role`,
            [email, passwordHash, fullName]
        );

        const admin = result.rows[0];

        // Generate token
        const token = generateToken(admin.id, admin.email, UserRole.ADMIN);

        res.status(201).json({
            success: true,
            message: 'Admin registered successfully',
            token,
            user: {
                id: admin.id,
                email: admin.email,
                role: UserRole.ADMIN,
                name: admin.full_name
            }
        });
    } catch (error) {
        console.error('Register admin error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register admin'
        });
    }
};

// Login
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password, role } = req.body as LoginRequest;

        // Validate input
        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                error: 'Email, password, and role are required'
            });
        }

        let userQuery: string;
        let tableName: string;
        let nameField: string;

        // Determine which table to query based on role
        switch (role) {
            case UserRole.STUDENT:
                tableName = 'students';
                nameField = 'full_name';
                break;
            case UserRole.COMPANY:
                tableName = 'companies';
                nameField = 'company_name';
                break;
            case UserRole.ADMIN:
                tableName = 'admins';
                nameField = 'full_name';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid role'
                });
        }

        userQuery = `SELECT id, email, password_hash, ${nameField} as name FROM ${tableName} WHERE email = $1`;

        // Find user
        const result = await query(userQuery, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const user = result.rows[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user.id, user.email, role);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                role,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed'
        });
    }
};

// Get current user
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated'
            });
        }

        const { id, role } = req.user;

        let userQuery: string;
        let tableName: string;
        let nameField: string;

        switch (role) {
            case UserRole.STUDENT:
                tableName = 'students';
                nameField = 'full_name';
                userQuery = `SELECT id, email, ${nameField} as name, roll_number, department, cgpa, graduation_year, resume_url FROM ${tableName} WHERE id = $1`;
                break;
            case UserRole.COMPANY:
                tableName = 'companies';
                nameField = 'company_name';
                userQuery = `SELECT id, email, ${nameField} as name, industry, website, hr_contact_name, hr_contact_phone FROM ${tableName} WHERE id = $1`;
                break;
            case UserRole.ADMIN:
                tableName = 'admins';
                nameField = 'full_name';
                userQuery = `SELECT id, email, ${nameField} as name, role FROM ${tableName} WHERE id = $1`;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid role'
                });
        }

        const result = await query(userQuery, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                ...result.rows[0],
                role
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user data'
        });
    }
};
