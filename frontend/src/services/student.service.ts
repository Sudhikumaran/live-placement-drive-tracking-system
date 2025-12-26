import api from './api';
import type { ApiResponse, PlacementDrive, Application, Notification, Offer } from '../types';

export const studentService = {
    // Get profile
    getProfile: async () => {
        const response = await api.get<ApiResponse>('/student/profile');
        return response.data;
    },

    // Update profile
    updateProfile: async (data: { fullName?: string; cgpa?: number; resumeUrl?: string }) => {
        const response = await api.put<ApiResponse>('/student/profile', data);
        return response.data;
    },

    // Get all active drives
    getDrives: async () => {
        const response = await api.get<ApiResponse<PlacementDrive[]>>('/student/drives');
        return response.data;
    },

    // Get eligible drives
    getEligibleDrives: async () => {
        const response = await api.get<ApiResponse<PlacementDrive[]>>('/student/drives/eligible');
        return response.data;
    },

    // Apply to drive
    applyToDrive: async (driveId: string) => {
        const response = await api.post<ApiResponse>(`/student/apply/${driveId}`);
        return response.data;
    },

    // Get my applications
    getMyApplications: async () => {
        const response = await api.get<ApiResponse<Application[]>>('/student/applications');
        return response.data;
    },

    // Get application details
    getApplicationDetails: async (applicationId: string) => {
        const response = await api.get<ApiResponse<Application>>(`/student/applications/${applicationId}`);
        return response.data;
    },

    // Get notifications
    getNotifications: async (limit = 50) => {
        const response = await api.get<ApiResponse<Notification[]>>(`/student/notifications?limit=${limit}`);
        return response.data;
    },

    // Mark notification as read
    markNotificationRead: async (notificationId: string) => {
        const response = await api.put<ApiResponse>(`/student/notifications/${notificationId}/read`);
        return response.data;
    },

    // Get offers
    getOffers: async () => {
        const response = await api.get<ApiResponse<Offer[]>>('/student/offers');
        return response.data;
    },

    // Accept offer
    acceptOffer: async (offerId: string) => {
        const response = await api.put<ApiResponse>(`/student/offers/${offerId}/accept`);
        return response.data;
    },

    // Decline offer
    declineOffer: async (offerId: string) => {
        const response = await api.put<ApiResponse>(`/student/offers/${offerId}/decline`);
        return response.data;
    },
};

export default studentService;
