require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const User = require('./models/User');
const Auction = require('./models/Auction');

const checkDatabase = async () => {
    try {
        await connectDB();
        console.log('🔍 Checking database contents...\n');

        // Check users
        const users = await User.find({});
        console.log(`👥 Users in database: ${users.length}`);
        users.forEach(user => {
            console.log(`   - ${user.username} (${user.email})`);
        });

        // Check auctions
        const auctions = await Auction.find({});
        console.log(`\n🏷️ Auctions in database: ${auctions.length}`);
        auctions.forEach(auction => {
            console.log(`   - ${auction.productName} - ₹${auction.startingPrice.toLocaleString('en-IN')}`);
        });

        console.log('\n✅ Database check complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database check failed:', error);
        process.exit(1);
    }
};

checkDatabase();