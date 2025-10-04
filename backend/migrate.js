require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');

// Connect to database
connectDB();

async function migrateAuctions() {
    try {
        console.log('Starting auction migration...');
        
        // Find all auctions without proper fields
        const auctions = await mongoose.connection.db.collection('auctions').find({}).toArray();
        
        console.log(`Found ${auctions.length} auctions to check`);
        
        let updateCount = 0;
        
        for (const auction of auctions) {
            const updates = {};
            
            // Set default status if missing
            if (!auction.status) {
                updates.status = 'ended';
            }
            
            // Set scheduledStartTime if missing
            if (!auction.scheduledStartTime) {
                updates.scheduledStartTime = auction.createdAt || new Date();
            }
            
            // Apply updates if any
            if (Object.keys(updates).length > 0) {
                await mongoose.connection.db.collection('auctions').updateOne(
                    { _id: auction._id },
                    { $set: updates }
                );
                updateCount++;
                console.log(`Updated auction ${auction._id}: ${JSON.stringify(updates)}`);
            }
        }
        
        console.log(`Migration completed: ${updateCount} auctions updated`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Wait for connection then run migration
mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB for migration');
    migrateAuctions();
});