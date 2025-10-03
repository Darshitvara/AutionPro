const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No token provided. Authorization denied.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token. Authorization denied.'
            });
        }

        // Check if user exists
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found. Authorization denied.'
            });
        }

        // Attach user to request
        req.user = {
            userId: decoded.userId,
            username: decoded.username
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error in authentication'
        });
    }
};

/**
 * Socket authentication middleware
 * Verifies JWT token for Socket.IO connections
 */
const socketAuthMiddleware = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        const decoded = verifyToken(token);

        if (!decoded) {
            return next(new Error('Authentication error: Invalid token'));
        }

        // Check if user exists
        const user = await User.findById(decoded.userId);

        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }

        // Attach user to socket
        socket.user = {
            userId: decoded.userId,
            username: decoded.username
        };

        next();
    } catch (error) {
        console.error('Socket auth error:', error);
        next(new Error('Authentication error'));
    }
};

module.exports = {
    authMiddleware,
    socketAuthMiddleware
};
