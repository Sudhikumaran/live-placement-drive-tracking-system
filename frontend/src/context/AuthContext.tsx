import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserRole } from '../types';
import authService from '../services/auth.service';
import { initializeSocket, disconnectSocket } from '../services/socket';

interface User {
    id: string;
    email: string;
    role: UserRole;
    name: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string, role: UserRole) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(parsedUser);

                // Initialize socket connection
                initializeSocket(storedToken);
            } catch (error) {
                console.error('Failed to parse stored user:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string, role: UserRole) => {
        try {
            const response = await authService.login({ email, password, role });

            if (response.success && response.token) {
                setToken(response.token);
                setUser(response.user);
                authService.saveAuthData(response.token, response.user);

                // Initialize socket connection
                initializeSocket(response.token);
            } else {
                throw new Error(response.error || 'Login failed');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        authService.logout();
        disconnectSocket();
        window.location.href = '/login';
    };

    const value: AuthContextType = {
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!user && !!token,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default AuthContext;
