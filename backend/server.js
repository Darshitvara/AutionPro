require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');

const config = require('./config/config');
const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const SocketService = require('./services/socketService');
const auctionScheduler = require('./services/auctionScheduler');
const Auction = require('./models/Auction');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Production optimizations
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
  });
}
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIO(server, {
    cors: {
        origin: [
            config.CLIENT_URL,           // Production frontend
            'http://localhost:5173',     // Local development
            'http://localhost:5174',     // Alternative local port
            'http://127.0.0.1:5173'      // Alternative localhost format
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: [
        config.CLIENT_URL,           // Production frontend
        'http://localhost:5173',     // Local development
        'http://localhost:5174',     // Alternative local port
        'http://127.0.0.1:5173'      // Alternative localhost format
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// API Routes
// Root wake-up endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Auction backend server is awake and running',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Auction backend is running',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Initialize Socket.IO service
const socketService = new SocketService(io);

// Make io available globally for the auction scheduler
global.io = io;

// Initialize auction scheduler
auctionScheduler.initialize().catch(console.error);

// Start server
server.listen(config.PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 AUCTION BACKEND SERVER');
    console.log('='.repeat(50));
    console.log(`📡 Server running on: http://localhost:${config.PORT}`);
    console.log(`🌍 Environment: ${config.NODE_ENV}`);
    console.log(`🔗 Client URL: ${config.CLIENT_URL}`);
    console.log(`💾 Database: Connected to MongoDB`);
    console.log('='.repeat(50));
    console.log('✅ Server ready! Use npm run seed to populate sample data.');
    console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

module.exports = { app, server, io };
