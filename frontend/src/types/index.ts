// Shared TypeScript types for frontend

export enum UserRole {
    STUDENT = 'STUDENT',
    COMPANY = 'COMPANY',
    ADMIN = 'ADMIN'
}

export enum ApplicationStatus {
    APPLIED = 'APPLIED',
    IN_PROGRESS = 'IN_PROGRESS',
    SELECTED = 'SELECTED',
    REJECTED = 'REJECTED',
    OFFER_ACCEPTED = 'OFFER_ACCEPTED',
    OFFER_DECLINED = 'OFFER_DECLINED'
}

export enum RoundStatus {
    PENDING = 'PENDING',
    SELECTED = 'SELECTED',
    REJECTED = 'REJECTED'
}

export enum DriveStatus {
    ACTIVE = 'ACTIVE',
    CLOSED = 'CLOSED',
    COMPLETED = 'COMPLETED'
}

// User types
export interface Student {
    id: string;
    email: string;
    full_name: string;
    roll_number: string;
    department: string;
    cgpa: number;
    graduation_year: number;
    resume_url?: string;
    created_at: string;
}

export interface Company {
    id: string;
    email: string;
    company_name: string;
    industry?: string;
    website?: string;
    hr_contact_name?: string;
    hr_contact_phone?: string;
    created_at: string;
}

export interface Admin {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
}

// Auth types
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

export interface RegisterStudentRequest {
    email: string;
    password: string;
    fullName: string;
    rollNumber: string;
    department: string;
    cgpa: number;
    graduationYear: number;
}

// Placement Drive types
export interface PlacementDrive {
    id: string;
    company_id: string;
    company_name?: string;
    title: string;
    description?: string;
    job_role: string;
    ctc: number;
    location?: string;
    eligible_departments: string[];
    min_cgpa: number;
    total_rounds: number;
    status: DriveStatus;
    drive_date?: string;
    applicant_count?: number;
    already_applied?: number;
    created_at: string;
}

// Application types
export interface Application {
    id: string;
    student_id: string;
    drive_id: string;
    current_round: number;
    overall_status: ApplicationStatus;
    applied_at: string;
    // Joined data
    title?: string;
    job_role?: string;
    ctc?: number;
    company_name?: string;
    industry?: string;
    total_rounds?: number;
    rounds?: ShortlistRound[];
    offer_id?: string;
    offer_ctc?: number;
    offer_status?: string;
}

export interface ShortlistRound {
    id: string;
    application_id: string;
    round_number: number;
    status: RoundStatus;
    round_name?: string;
    feedback?: string;
    created_at: string;
    updated_at: string;
}

// Notification types
export interface Notification {
    id: string;
    user_id: string;
    user_role: UserRole;
    title: string;
    message: string;
    type: string;
    related_drive_id?: string;
    is_read: boolean;
    created_at: string;
    drive_title?: string;
}

// Offer types
export interface Offer {
    id: string;
    application_id: string;
    ctc: number;
    joining_date?: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    created_at: string;
    // Joined data
    title?: string;
    job_role?: string;
    company_name?: string;
    industry?: string;
}

// Applicant type (for companies)
export interface Applicant {
    id: string;
    student_id: string;
    drive_id: string;
    current_round: number;
    overall_status: ApplicationStatus;
    applied_at: string;
    // Student details
    full_name: string;
    roll_number: string;
    department: string;
    cgpa: number;
    graduation_year: number;
    resume_url?: string;
    email: string;
    rounds?: ShortlistRound[];
}

// Analytics types
export interface DepartmentStats {
    department: string;
    totalStudents: number;
    placedStudents: number;
    percentage: number;
    averageCTC: number;
}

export interface CompanyStats {
    companyName: string;
    applicants: number;
    shortlisted: number;
    selected: number;
    conversionRate: number;
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
    departmentStats: DepartmentStats[];
    companyStats: CompanyStats[];
}

// API Response wrapper
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}
