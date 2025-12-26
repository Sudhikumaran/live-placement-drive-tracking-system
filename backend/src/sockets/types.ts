// Socket.IO Event Types and Contracts

// Event namespaces
export enum SocketNamespace {
    STUDENT = '/student',
    COMPANY = '/company',
    ADMIN = '/admin'
}

// Event names
export enum SocketEvent {
    // Connection
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    JOIN_ROOM = 'join:room',

    // Drive events
    DRIVE_CREATED = 'drive:created',
    DRIVE_UPDATED = 'drive:updated',
    DRIVE_CLOSED = 'drive:closed',

    // Application events
    APPLICATION_SUBMITTED = 'application:submitted',
    APPLICATION_UPDATED = 'application:updated',

    // Shortlist events
    SHORTLIST_UPDATE = 'shortlist:update',
    ROUND_STATUS_CHANGED = 'round:status_changed',

    // Notification events
    NOTIFICATION_NEW = 'notification:new',
    NOTIFICATION_READ = 'notification:read',

    // Analytics events
    ANALYTICS_UPDATE = 'analytics:update',

    // Offer events
    OFFER_CREATED = 'offer:created',
    OFFER_UPDATED = 'offer:updated'
}

// Status enums
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

export enum UserRole {
    STUDENT = 'STUDENT',
    COMPANY = 'COMPANY',
    ADMIN = 'ADMIN'
}

// Event payload interfaces
export interface DriveCreatedPayload {
    driveId: string;
    companyId: string;
    companyName: string;
    title: string;
    jobRole: string;
    ctc: number;
    eligibleDepartments: string[];
    minCgpa: number;
    driveDate: string;
    createdAt: string;
}

export interface ApplicationSubmittedPayload {
    applicationId: string;
    studentId: string;
    studentName: string;
    rollNumber: string;
    department: string;
    driveId: string;
    driveName: string;
    companyId: string;
    appliedAt: string;
}

export interface ShortlistUpdatePayload {
    applicationId: string;
    studentId: string;
    studentName: string;
    companyId: string;
    companyName: string;
    driveId: string;
    driveName: string;
    roundNumber: number;
    roundName: string;
    status: RoundStatus;
    overallStatus: ApplicationStatus;
    feedback?: string;
    updatedAt: string;
}

export interface NotificationPayload {
    id: string;
    userId: string;
    userRole: UserRole;
    title: string;
    message: string;
    type: string;
    relatedDriveId?: string;
    isRead: boolean;
    createdAt: string;
}

export interface OfferPayload {
    offerId: string;
    applicationId: string;
    studentId: string;
    studentName: string;
    companyId: string;
    companyName: string;
    driveName: string;
    ctc: number;
    joiningDate?: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    createdAt: string;
}

export interface AnalyticsUpdatePayload {
    totalDrives: number;
    activeDrives: number;
    totalApplications: number;
    totalStudents: number;
    placedStudents: number;
    placementPercentage: number;
    departmentStats: {
        department: string;
        totalStudents: number;
        placedStudents: number;
        percentage: number;
        averageCTC: number;
    }[];
    companyStats: {
        companyName: string;
        applicants: number;
        shortlisted: number;
        selected: number;
        conversionRate: number;
    }[];
    updatedAt: string;
}

// Socket acknowledgement types
export interface SocketAck<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

// Client-to-server event map
export interface ClientToServerEvents {
    [SocketEvent.JOIN_ROOM]: (roomId: string) => void;

    [SocketEvent.NOTIFICATION_READ]: (
        notificationId: string,
        callback: (ack: SocketAck) => void
    ) => void;
}

// Server-to-client event map
export interface ServerToClientEvents {
    [SocketEvent.DRIVE_CREATED]: (payload: DriveCreatedPayload) => void;
    [SocketEvent.DRIVE_UPDATED]: (payload: DriveCreatedPayload) => void;
    [SocketEvent.DRIVE_CLOSED]: (payload: { driveId: string; companyId: string }) => void;

    [SocketEvent.APPLICATION_SUBMITTED]: (payload: ApplicationSubmittedPayload) => void;
    [SocketEvent.APPLICATION_UPDATED]: (payload: ApplicationSubmittedPayload) => void;

    [SocketEvent.SHORTLIST_UPDATE]: (payload: ShortlistUpdatePayload) => void;
    [SocketEvent.ROUND_STATUS_CHANGED]: (payload: ShortlistUpdatePayload) => void;

    [SocketEvent.NOTIFICATION_NEW]: (payload: NotificationPayload) => void;

    [SocketEvent.ANALYTICS_UPDATE]: (payload: AnalyticsUpdatePayload) => void;

    [SocketEvent.OFFER_CREATED]: (payload: OfferPayload) => void;
    [SocketEvent.OFFER_UPDATED]: (payload: OfferPayload) => void;
}

// Socket data stored with connection
export interface SocketData {
    userId: string;
    userRole: UserRole;
    email: string;
}
