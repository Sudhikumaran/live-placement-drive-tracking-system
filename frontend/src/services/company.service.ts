import api from './api';
import type { ApiResponse, PlacementDrive, Applicant } from '../types';

export const companyService = {
    // Profile
    getProfile: async () => {
        const response = await api.get<ApiResponse>('/company/profile');
        return response.data;
    },

    updateProfile: async (data: {
        companyName?: string;
        industry?: string;
        website?: string;
        hrContactName?: string;
        hrContactPhone?: string;
    }) => {
        const response = await api.put<ApiResponse>('/company/profile', data);
        return response.data;
    },

    // Drives
    getMyDrives: async () => {
        const response = await api.get<ApiResponse<PlacementDrive[]>>('/company/drives');
        return response.data;
    },

    createDrive: async (data: {
        title: string;
        description?: string;
        jobRole: string;
        ctc: number;
        location?: string;
        eligibleDepartments: string[];
        minCgpa: number;
        totalRounds: number;
        driveDate?: string;
    }) => {
        const response = await api.post<ApiResponse>('/company/drives', data);
        return response.data;
    },

    updateDrive: async (driveId: string, data: any) => {
        const response = await api.put<ApiResponse>(`/company/drives/${driveId}`, data);
        return response.data;
    },

    // Applicants
    getApplicants: async (driveId: string) => {
        const response = await api.get<ApiResponse<Applicant[]>>(`/company/drives/${driveId}/applicants`);
        return response.data;
    },

    // Shortlisting
    updateShortlist: async (data: {
        applicationId: string;
        roundNumber: number;
        roundName: string;
        status: 'SELECTED' | 'REJECTED';
        feedback?: string;
    }) => {
        const response = await api.post<ApiResponse>('/company/shortlist', data);
        return response.data;
    },

    // Offers
    createOffer: async (data: {
        applicationId: string;
        ctc: number;
        joiningDate?: string;
        offerLetterUrl?: string;
    }) => {
        const response = await api.post<ApiResponse>('/company/offers', data);
        return response.data;
    },

    // Analytics
    getDriveAnalytics: async (driveId: string) => {
        const response = await api.get<ApiResponse>(`/company/analytics/${driveId}`);
        return response.data;
    },
};

export default companyService;
