import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initializeSocket } from './config/socket';
import pool from './config/database';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Import routes (to be created)
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import companyRoutes from './routes/company.routes';
import adminRoutes from './routes/admin.routes';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer);

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Health check route
app.get('/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Live Placement Drive Tracker API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: Function) => {
    console.error('❌ Error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

// Start server
httpServer.listen(PORT, async () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   🎓 Live Placement Drive Tracker API               ║
║                                                      ║
║   Server: http://localhost:${PORT}                    ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
  `);

    // Test database connection
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Database connected successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    httpServer.close(() => {
        pool.end();
        process.exit(0);
    });
});

export default app;
