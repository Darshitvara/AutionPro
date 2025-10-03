const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRE } = require('../config/config');

/**
 * Generate JWT token
 * @param {number} userId - User ID
 * @param {string} username - Username
 * @returns {string} JWT token
 */
const generateToken = (userId, username) => {
    return jwt.sign(
        { userId, username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRE }
    );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object|null} Decoded token or null
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = { generateToken, verifyToken };
