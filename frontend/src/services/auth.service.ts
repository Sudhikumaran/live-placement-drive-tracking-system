import api from './api';
import type { LoginRequest, LoginResponse, RegisterStudentRequest, ApiResponse, UserRole } from '../types';

export const authService = {
    // Login
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>('/auth/login', credentials);
        return response.data;
    },

    // Register Student
    registerStudent: async (data: RegisterStudentRequest): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>('/auth/register/student', data);
        return response.data;
    },

    // Register Company
    registerCompany: async (data: {
        email: string;
        password: string;
        companyName: string;
        industry?: string;
        website?: string;
        hrContactName?: string;
        hrContactPhone?: string;
    }): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>('/auth/register/company', data);
        return response.data;
    },

    // Register Admin
    registerAdmin: async (data: {
        email: string;
        password: string;
        fullName: string;
    }): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>('/auth/register/admin', data);
        return response.data;
    },

    // Get current user
    getCurrentUser: async <T>(): Promise<ApiResponse<T>> => {
        const response = await api.get<ApiResponse<T>>('/auth/me');
        return response.data;
    },

    // Logout
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Check if authenticated
    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('token');
    },

    // Get user role
    getUserRole: (): UserRole | null => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            const user = JSON.parse(userStr);
            return user.role;
        } catch {
            return null;
        }
    },

    // Save auth data
    saveAuthData: (token: string, user: any) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },
};

export default authService;
