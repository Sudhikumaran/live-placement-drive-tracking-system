// Shared TypeScript types for the application

import { Request } from 'express';
import { UserRole } from '../sockets/types';

// Extending Express Request to include user data from JWT
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
    };
}

// Database model interfaces
export interface Student {
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    rollNumber: string;
    department: string;
    cgpa: number;
    graduationYear: number;
    resumeUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Company {
    id: string;
    email: string;
    passwordHash: string;
    companyName: string;
    industry?: string;
    website?: string;
    hrContactName?: string;
    hrContactPhone?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Admin {
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PlacementDrive {
    id: string;
    companyId: string;
    title: string;
    description?: string;
    jobRole: string;
    ctc: number;
    location?: string;
    eligibleDepartments: string[];
    minCgpa: number;
    totalRounds: number;
    status: string;
    driveDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Application {
    id: string;
    studentId: string;
    driveId: string;
    currentRound: number;
    overallStatus: string;
    appliedAt: Date;
    updatedAt: Date;
}

export interface ShortlistRound {
    id: string;
    applicationId: string;
    roundNumber: number;
    status: string;
    roundName?: string;
    feedback?: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Notification {
    id: string;
    userId: string;
    userRole: string;
    title: string;
    message: string;
    type: string;
    relatedDriveId?: string;
    isRead: boolean;
    createdAt: Date;
}

export interface Offer {
    id: string;
    applicationId: string;
    ctc: number;
    joiningDate?: Date;
    offerLetterUrl?: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

// API Request/Response types
export interface RegisterStudentRequest {
    email: string;
    password: string;
    fullName: string;
    rollNumber: string;
    department: string;
    cgpa: number;
    graduationYear: number;
}

export interface RegisterCompanyRequest {
    email: string;
    password: string;
    companyName: string;
    industry?: string;
    website?: string;
    hrContactName?: string;
    hrContactPhone?: string;
}

export interface RegisterAdminRequest {
    email: string;
    password: string;
    fullName: string;
}

export interface LoginRequest {
    email: string;
    password: string;
    role: UserRole;
}

export interface LoginResponse {
    success: boolean;
    token: string;
    user: {
        id: string;
        email: string;
        role: UserRole;
        name: string;
    };
}

export interface CreateDriveRequest {
    title: string;
    description?: string;
    jobRole: string;
    ctc: number;
    location?: string;
    eligibleDepartments: string[];
    minCgpa: number;
    totalRounds: number;
    driveDate?: string;
}

export interface ShortlistRequest {
    applicationId: string;
    roundNumber: number;
    roundName: string;
    status: 'SELECTED' | 'REJECTED';
    feedback?: string;
}

export interface CreateOfferRequest {
    applicationId: string;
    ctc: number;
    joiningDate?: string;
    offerLetterUrl?: string;
}

// Analytics types
export interface DepartmentAnalytics {
    department: string;
    totalStudents: number;
    placedStudents: number;
    percentage: number;
    averageCTC: number;
}

export interface CompanyAnalytics {
    companyName: string;
    applicants: number;
    shortlisted: number;
    selected: number;
    conversionRate: number;
    averageRoundsToHire: number;
}

export interface RoundDropoffAnalytics {
    roundNumber: number;
    roundName: string;
    entered: number;
    cleared: number;
    dropoffRate: number;
}

export interface OverallAnalytics {
    totalStudents: number;
    placedStudents: number;
    placementPercentage: number;
    totalDrives: number;
    activeDrives: number;
    completedDrives: number;
    totalApplications: number;
    averageApplicationsPerStudent: number;
    totalOffers: number;
    offersAccepted: number;
    offersPending: number;
    acceptanceRate: number;
    multipleOfferStudents: number;
    departmentStats: DepartmentAnalytics[];
    companyStats: CompanyAnalytics[];
    roundDropoff: RoundDropoffAnalytics[];
}

// API Response wrapper
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}
