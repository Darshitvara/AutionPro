module.exports = {
    PORT: process.env.PORT || 5000,
    JWT_SECRET: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/auction_system'
};
