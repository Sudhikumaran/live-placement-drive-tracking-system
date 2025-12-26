import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            try {
                const socketInstance = getSocket();
                setSocket(socketInstance);

                socketInstance.on('connect', () => {
                    console.log('Socket connected');
                    setConnected(true);
                });

                socketInstance.on('disconnect', () => {
                    console.log('Socket disconnected');
                    setConnected(false);
                });

                return () => {
                    socketInstance.off('connect');
                    socketInstance.off('disconnect');
                };
            } catch (error) {
                console.error('Socket initialization error:', error);
            }
        }
    }, [isAuthenticated]);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = (): SocketContextType => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export default SocketContext;
