const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { connectDB, setupIndexes } = require('./src/config/database');
const logger = require('./src/utils/logger');
const SocketManager = require('./src/utils/socketManager');
const Scheduler = require('./src/utils/scheduler');
const seedData = require('./src/utils/seedData');
const errorHandler = require('./src/middleware/errorHandler');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const residentRoutes = require('./src/routes/residents');
const vitalsRoutes = require('./src/routes/vitals');
const incidentRoutes = require('./src/routes/incidents');
const assignmentRoutes = require('./src/routes/assignments');
const analyticsRoutes = require('./src/routes/analytics');
const reportRoutes = require('./src/routes/reports');

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Initialize Socket Manager
const socketManager = new SocketManager(io);
socketManager.initialize();

// Make io and socketManager accessible to routes
app.set('io', io);
app.set('socketManager', socketManager);

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Connect to database
connectDB().then(async () => {
  // Setup database indexes after connection
  setupIndexes();
  
  // Seed initial data
  await seedData();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);

// Socket.IO connection handling is now managed by SocketManager

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;