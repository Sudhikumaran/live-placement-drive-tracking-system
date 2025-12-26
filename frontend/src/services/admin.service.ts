import api from './api';
import type { ApiResponse, PlacementDrive, Student, Company, OverallAnalytics } from '../types';

export const adminService = {
    // Drive Management
    getAllDrives: async () => {
        const response = await api.get<ApiResponse<PlacementDrive[]>>('/admin/drives');
        return response.data;
    },

    getDriveDetails: async (driveId: string) => {
        const response = await api.get<ApiResponse<PlacementDrive>>(`/admin/drives/${driveId}`);
        return response.data;
    },

    updateDriveStatus: async (driveId: string, status: 'ACTIVE' | 'CLOSED' | 'COMPLETED') => {
        const response = await api.put<ApiResponse>(`/admin/drives/${driveId}/status`, { status });
        return response.data;
    },

    // User Management
    getAllStudents: async () => {
        const response = await api.get<ApiResponse<Student[]>>('/admin/students');
        return response.data;
    },

    getAllCompanies: async () => {
        const response = await api.get<ApiResponse<Company[]>>('/admin/companies');
        return response.data;
    },

    // Analytics
    getOverallAnalytics: async () => {
        const response = await api.get<ApiResponse<OverallAnalytics>>('/admin/analytics/overview');
        return response.data;
    },

    getDepartmentAnalytics: async (department: string) => {
        const response = await api.get<ApiResponse>(`/admin/analytics/department/${department}`);
        return response.data;
    },

    getCompanyAnalytics: async (companyId: string) => {
        const response = await api.get<ApiResponse>(`/admin/analytics/company/${companyId}`);
        return response.data;
    },

    // Exports
    exportPlacements: async () => {
        const response = await api.get('/admin/export/placements', {
            responseType: 'blob',
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `placements_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    exportStudents: async () => {
        const response = await api.get('/admin/export/students', {
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
};

export default adminService;
