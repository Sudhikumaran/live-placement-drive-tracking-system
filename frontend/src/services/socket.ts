import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const initializeSocket = (token: string): Socket => {
    if (socket?.connected) {
        return socket;
    }

    socket = io(SOCKET_URL, {
        auth: {
            token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
        console.log('✅ Socket.IO connected');
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Socket.IO disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
    });

    return socket;
};

export const getSocket = (): Socket => {
    if (!socket) {
        throw new Error('Socket not initialized. Call initializeSocket first.');
    }
    return socket;
};

export const disconnectSocket = (): void => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export default {
    initialize: initializeSocket,
    get: getSocket,
    disconnect: disconnectSocket,
};
