import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

export const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true
        }
    });

    // Socket authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.userId}`);

        // Join user-specific room
        socket.join(`user_${socket.userId}`);

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${socket.userId}`);
        });

        // Custom events can be added here
        socket.on('join_drive', (driveId) => {
            socket.join(`drive_${driveId}`);
            console.log(`User ${socket.userId} joined drive ${driveId}`);
        });

        socket.on('leave_drive', (driveId) => {
            socket.leave(`drive_${driveId}`);
            console.log(`User ${socket.userId} left drive ${driveId}`);
        });
    });

    return io;
};

// Notification helpers
export const notifyStudent = (io, userId, data) => {
    io.to(`user_${userId}`).emit('notification', data);
};

export const notifyDrive = (io, driveId, data) => {
    io.to(`drive_${driveId}`).emit('drive_update', data);
};
