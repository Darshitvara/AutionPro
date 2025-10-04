const mongoose = require('mongoose');
const connectDB = require('./config/database');

// Define the old auction schema for reference
const AuctionSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['scheduled', 'active', 'ended', 'cancelled', 'upcoming', 'live', 'closed'], // Allow both old and new values temporarily
        default: 'upcoming'
    }
}, { strict: false }); // Allow additional fields

const Auction = mongoose.model('TempAuction', AuctionSchema, 'auctions');

async function migrateAuctionStatuses() {
    try {
        console.log('🔄 Starting auction status migration...');
        
        await connectDB();
        
        // Update old status values to new ones
        const statusMigrations = [
            { from: 'scheduled', to: 'upcoming' },
            { from: 'active', to: 'live' },
            { from: 'ended', to: 'closed' }
            // 'cancelled' remains the same
        ];
        
        let totalUpdated = 0;
        
        for (const migration of statusMigrations) {
            const result = await Auction.updateMany(
                { status: migration.from },
                { status: migration.to }
            );
            
            console.log(`✅ Updated ${result.modifiedCount} auctions from '${migration.from}' to '${migration.to}'`);
            totalUpdated += result.modifiedCount;
        }
        
        // Handle auctions with null or missing status field
        const nullStatusResult = await Auction.updateMany(
            { 
                $or: [
                    { status: null },
                    { status: { $exists: false } }
                ]
            },
            { status: 'closed' } // Default old auctions to closed
        );
        
        console.log(`✅ Updated ${nullStatusResult.modifiedCount} auctions from null/missing status to 'closed'`);
        totalUpdated += nullStatusResult.modifiedCount;
        
        // Also clean up any isActive fields that might still exist
        const isActiveCleanup = await Auction.updateMany(
            { isActive: { $exists: true } },
            { $unset: { isActive: 1 } }
        );
        
        console.log(`✅ Removed isActive field from ${isActiveCleanup.modifiedCount} auctions`);
        
        console.log(`🎉 Migration completed! Total auctions updated: ${totalUpdated}`);
        
        // Verify the migration
        const statusCounts = await Auction.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        
        console.log('\n📊 Current status distribution:');
        statusCounts.forEach(({ _id, count }) => {
            console.log(`   ${_id}: ${count}`);
        });
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the migration if this file is executed directly
if (require.main === module) {
    migrateAuctionStatuses();
}

module.exports = { migrateAuctionStatuses };