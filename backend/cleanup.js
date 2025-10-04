require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');

// Connect to database
connectDB();

async function cleanupAuctions() {
    try {
        console.log('Starting auction cleanup...');
        
        // Find auctions with corrupted data
        const auctions = await mongoose.connection.db.collection('auctions').find({
            $or: [
                { status: { $type: "object" } },
                { scheduledStartTime: { $type: "object" } }
            ]
        }).toArray();
        
        console.log(`Found ${auctions.length} corrupted auctions`);
        
        for (const auction of auctions) {
            const updates = {};
            
            // Fix status if it's an object
            if (typeof auction.status === 'object') {
                updates.status = 'ended';
            }
            
            // Fix scheduledStartTime if it's an object
            if (typeof auction.scheduledStartTime === 'object') {
                updates.scheduledStartTime = auction.createdAt || new Date();
            }
            
            if (Object.keys(updates).length > 0) {
                await mongoose.connection.db.collection('auctions').updateOne(
                    { _id: auction._id },
                    { $set: updates }
                );
                console.log(`Cleaned auction ${auction._id}: ${JSON.stringify(updates)}`);
            }
        }
        
        console.log('Cleanup completed');
        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

// Wait for connection then run cleanup
mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB for cleanup');
    cleanupAuctions();
});