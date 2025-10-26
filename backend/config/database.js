const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config');

const connectDB = async () => {
    try {
        // Sensible defaults for lower latency and stable connections
        const conn = await mongoose.connect(MONGODB_URI, {
            maxPoolSize: 20,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 20000,
            family: 4
        });

        // Disable autoIndex in production to avoid startup/index overhead
        if (process.env.NODE_ENV === 'production') {
            mongoose.set('autoIndex', false);
        }

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;