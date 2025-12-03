const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/User');
const Auction = require('./models/Auction');
// Always load env from backend/.env regardless of where the script is invoked
require('dotenv').config({ path: path.join(__dirname, '.env') });

const seedData = async () => {
  try {
    // Use the same default DB name as backend/config/config.js to avoid mismatches
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/auction_system';
    const isRemote = mongoUri.startsWith('mongodb+srv://');
    console.log(`[SEED] Connecting to MongoDB ${isRemote ? '(remote cluster)' : '(local)'}...`);
    await mongoose.connect(mongoUri);

    // Clear only auction data as requested
    await Auction.deleteMany({});
    console.log('[SEED] All existing auctions deleted.');

    // Ensure we have some users available for bid history references
    let users = await User.find({}).limit(5);
    if (!users || users.length < 4) {
      const needed = 4 - (users ? users.length : 0);
      const created = await User.create([
        {
          username: 'admin',
          email: 'admin@example.com',
          password: 'password123',
          role: 'admin'
        },
        {
          username: 'john_doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'user'
        },
        {
          username: 'jane_smith',
          email: 'jane@example.com',
          password: 'password123',
          role: 'user'
        },
        {
          username: 'bob_wilson',
          email: 'bob@example.com',
          password: 'password123',
          role: 'user'
        }
      ].slice(0, needed));
      users = [...(users || []), ...created];
      console.log('Users ensured:', users.length);
    } else {
      console.log('Using existing users:', users.length);
    }

    // Create auctions with proper status values
    const now = new Date();
    const minute = 60 * 1000;

    // Build 15 auctions: mostly upcoming (11), 2 live, 2 ended with direct image URLs
    const baseAuctions = [
      // 2 Live auctions
      { name: 'Apple MacBook Pro 16" M3', cat: 'Electronics', desc: 'M3 Max chip, 64GB RAM, 2TB SSD, space black. Brand new sealed.', start: 2500, type: 'live', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop' },
      { name: 'Rolex Submariner Date', cat: 'Watches', desc: 'Stainless steel, black dial, ceramic bezel. Mint condition with box.', start: 8000, type: 'live', img: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&h=600&fit=crop' },

      // 11 Upcoming auctions
      { name: 'Sony PlayStation 5 Pro', cat: 'Gaming', desc: 'Latest PS5 Pro console with 2TB storage and two DualSense controllers.', start: 600, type: 'upcoming', img: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop' },
      { name: 'Canon EOS R5 Camera', cat: 'Photography', desc: 'Full-frame mirrorless camera with 8K video, 45MP sensor.', start: 3200, type: 'upcoming', img: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop' },
      { name: 'Herman Miller Aeron Chair', cat: 'Furniture', desc: 'Ergonomic office chair, size B, fully adjustable, graphite.', start: 800, type: 'upcoming', img: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&h=600&fit=crop' },
      { name: 'iPad Pro 13" M4', cat: 'Electronics', desc: '13-inch iPad Pro with M4 chip, 512GB, WiFi + Cellular, space black.', start: 1400, type: 'upcoming', img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=600&fit=crop' },
      { name: 'Nike Air Jordan 4 Retro', cat: 'Fashion', desc: 'Military Blue colorway, size 10, brand new with tags and box.', start: 350, type: 'upcoming', img: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&h=600&fit=crop' },
      { name: 'Dyson Airwrap Complete', cat: 'Home & Beauty', desc: 'Hair styling tool with multiple attachments, nickel/copper finish.', start: 450, type: 'upcoming', img: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&h=600&fit=crop' },
      { name: 'Bose QuietComfort Ultra', cat: 'Audio', desc: 'Wireless noise-cancelling headphones with spatial audio, black.', start: 280, type: 'upcoming', img: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&h=600&fit=crop' },
      { name: 'Samsung Galaxy S24 Ultra', cat: 'Electronics', desc: '512GB, titanium gray, unlocked with S Pen and protective case.', start: 1100, type: 'upcoming', img: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&h=600&fit=crop' },
      { name: 'DJI Mavic 3 Pro Drone', cat: 'Photography', desc: 'Professional drone with triple camera system and RC Pro controller.', start: 1800, type: 'upcoming', img: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&h=600&fit=crop' },
      { name: 'Lego Millennium Falcon UCS', cat: 'Collectibles', desc: 'Ultimate Collector Series set 75192, 7541 pieces, sealed box.', start: 750, type: 'upcoming', img: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&h=600&fit=crop' },
      { name: 'Nintendo Switch OLED', cat: 'Gaming', desc: 'OLED model with enhanced screen, neon red/blue joy-cons.', start: 280, type: 'upcoming', img: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&h=600&fit=crop' },

      // 2 Ended auctions
      { name: 'Apple Watch Ultra 2', cat: 'Electronics', desc: '49mm titanium case, alpine loop, GPS + Cellular.', start: 700, type: 'closed', img: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&h=600&fit=crop' },
      { name: 'Gibson Les Paul Standard', cat: 'Musical Instruments', desc: '60s Standard electric guitar, heritage cherry sunburst.', start: 2200, type: 'closed', img: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=600&fit=crop' }
    ];

    const auctionsToInsert = baseAuctions.map((item, idx) => {
      // Time math
      const nowTs = now.getTime();
      const startOffset = (idx % 6 + 1) * 10 * minute; // staggered

      let scheduledStartTime;
      let endTime;
      let status = item.type;
      let startingPrice = item.start;
      let currentPrice = startingPrice;
      let bidHistory = [];
      let highestBidder = null;
      let highestBidderId = null;
      let winnerUsername = null;
      let finalPrice = null;
      let isActive = false;

      if (item.type === 'upcoming') {
        scheduledStartTime = new Date(nowTs + startOffset);
        endTime = new Date(nowTs + startOffset + 30 * minute);
      } else if (item.type === 'live') {
        scheduledStartTime = new Date(nowTs - 5 * minute); // Started 5 minutes ago
        endTime = new Date(nowTs + (25 + (idx % 5)) * minute); // Ends 25-30 minutes from now
        isActive = true;
        // Simulate bids
        const bid1 = startingPrice + Math.round(startingPrice * 0.1);
        const bid2 = bid1 + Math.round(startingPrice * 0.08);
        currentPrice = bid2;
        bidHistory = [
          {
            userId: users[1]?._id || users[0]._id,
            username: users[1]?.username || users[0].username,
            amount: bid1,
            timestamp: new Date(scheduledStartTime.getTime() + 5 * minute)
          },
          {
            userId: users[2]?._id || users[0]._id,
            username: users[2]?.username || users[0].username,
            amount: bid2,
            timestamp: new Date(scheduledStartTime.getTime() + 10 * minute)
          }
        ];
        highestBidder = bidHistory[1].username;
        highestBidderId = bidHistory[1].userId;
      } else if (item.type === 'closed') {
        scheduledStartTime = new Date(nowTs - (startOffset + 120 * minute));
        endTime = new Date(nowTs - (startOffset - 10 * minute));
        // Simulate bids and final
        const bid1 = startingPrice + Math.round(startingPrice * 0.12);
        const bid2 = bid1 + Math.round(startingPrice * 0.15);
        const bid3 = bid2 + Math.round(startingPrice * 0.07);
        currentPrice = bid3;
        bidHistory = [
          {
            userId: users[1]?._id || users[0]._id,
            username: users[1]?.username || users[0].username,
            amount: bid1,
            timestamp: new Date(scheduledStartTime.getTime() + 8 * minute)
          },
          {
            userId: users[3]?._id || users[0]._id,
            username: users[3]?.username || users[0].username,
            amount: bid2,
            timestamp: new Date(scheduledStartTime.getTime() + 16 * minute)
          },
          {
            userId: users[2]?._id || users[0]._id,
            username: users[2]?.username || users[0].username,
            amount: bid3,
            timestamp: new Date(scheduledStartTime.getTime() + 24 * minute)
          }
        ];
        highestBidder = bidHistory[2].username;
        highestBidderId = bidHistory[2].userId;
        winnerUsername = highestBidder;
        finalPrice = currentPrice;
        status = 'closed';
        isActive = false;
      }

      return {
        productName: item.name,
        product: {
          name: item.name,
          description: item.desc,
          image: item.img,
          category: item.cat
        },
        startingPrice,
        currentPrice,
        scheduledStartTime,
        endTime,
        status,
        isActive,
        durationMinutes: 30,
        bidHistory,
        highestBidder,
        highestBidderId,
        winnerUsername,
        finalPrice
      };
    });

    const auctions = await Auction.create(auctionsToInsert);

    console.log('Auctions created:', auctions.length);
    console.log('Seed data created successfully!');
    
    // Log the auction statuses for verification
    auctions.forEach(auction => {
      console.log(`${auction.productName}: ${auction.status}`);
    });

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
