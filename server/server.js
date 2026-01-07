import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeSocket } from './config/socket.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { startSchedulers } from './utils/scheduler.js';

// Import routes
import authRoutes from './routes/auth.js';
import driveRoutes from './routes/drives.js';
import applicationRoutes from './routes/applications.js';
import analyticsRoutes from './routes/analytics.js';
import profileRoutes from './routes/profile.js';
import searchRoutes from './routes/search.js';
import exportRoutes from './routes/export.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Make io accessible in routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Security & logging middleware
app.set('trust proxy', 1);
app.use(helmet());

const corsOptions = {
    origin: process.env.CLIENT_URL?.split(',') || ['http://localhost:5173'],
    credentials: true
};
app.use(cors(corsOptions));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api', limiter);

if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Live Placement Drive Tracker API',
        version: '1.0.0'
    });
});

// Health check endpoint (for load balancers)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness check endpoint (for orchestration)
app.get('/ready', (req, res) => {
    if (server.listening) {
        res.status(200).json({ ready: true });
    } else {
        res.status(503).json({ ready: false });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/drives', driveRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/export', exportRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// In production, serve client build statically
if (process.env.NODE_ENV === 'production') {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const clientDist = path.join(__dirname, '../client/dist');
    app.use(express.static(clientDist));
    // Fallback to index.html for SPA routes not starting with /api
    app.get(/^(?!\/api).*/, (req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
    });
}

// Error handling
app.use(notFound);
app.use(errorHandler);

// Connect to database and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        // Start background schedulers (deadline auto-close, etc.)
        startSchedulers();

        server.listen(PORT, () => {
            console.log(`\n🚀 Server running on port ${PORT}`);
            console.log(`📡 Socket.IO initialized`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`\n📍 API: http://localhost:${PORT}`);
            console.log(`📍 Health: http://localhost:${PORT}/health`);
            console.log(`📍 Ready: http://localhost:${PORT}/ready\n`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM signal received: closing HTTP server');
            server.close(() => {
                console.log('HTTP server closed');
                process.exit(0);
            });
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
