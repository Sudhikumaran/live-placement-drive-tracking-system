import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import {
    ServerToClientEvents,
    ClientToServerEvents,
    SocketData,
    SocketNamespace,
    SocketEvent,
    UserRole
} from '../sockets/types';

let io: Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;

export const initializeSocket = (httpServer: HTTPServer) => {
    io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    // Authentication middleware for Socket.IO
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
                id: string;
                email: string;
                role: UserRole;
            };

            // Store user data in socket
            socket.data.userId = decoded.id;
            socket.data.userRole = decoded.role;
            socket.data.email = decoded.email;

            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    // Connection handler
    io.on(SocketEvent.CONNECT, (socket) => {
        const { userId, userRole } = socket.data;
        console.log(`✅ User connected: ${userId} (${userRole})`);

        // Join user to their personal room
        socket.join(`user:${userId}`);

        // Join role-based room
        socket.join(`role:${userRole}`);

        // Handle disconnection
        socket.on(SocketEvent.DISCONNECT, () => {
            console.log(`❌ User disconnected: ${userId}`);
        });

        // Handle room joining (e.g., company joins specific drive room)
        socket.on(SocketEvent.JOIN_ROOM, (roomId: string) => {
            socket.join(roomId);
            console.log(`📍 User ${userId} joined room: ${roomId}`);
        });
    });

    console.log('✅ Socket.IO initialized');
    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized. Call initializeSocket first.');
    }
    return io;
};

export default io;
