const mongoose = require('mongoose');
const User = require('./models/User');
const Auction = require('./models/Auction');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auction-system');

    // Clear existing data
    await User.deleteMany({});
    await Auction.deleteMany({});

    // Create users
    const users = await User.create([
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
    ]);

    console.log('Users created:', users.length);

    // Create auctions with proper status values
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const auctions = await Auction.create([
      // Live auction (currently active)
      {
        productName: 'Vintage Rolex Watch',
        product: {
          name: 'Vintage Rolex Watch',
          description: 'A rare 1960s Rolex Submariner in excellent condition.',
          category: 'Jewelry'
        },
        startingPrice: 5000,
        currentPrice: 7500,
        scheduledStartTime: oneHourAgo,
        endTime: oneHourFromNow,
        status: 'live',
        bidHistory: [
          {
            userId: users[1]._id,
            username: users[1].username,
            amount: 5500,
            timestamp: new Date(oneHourAgo.getTime() + 10 * 60 * 1000)
          },
          {
            userId: users[2]._id,
            username: users[2].username,
            amount: 6000,
            timestamp: new Date(oneHourAgo.getTime() + 15 * 60 * 1000)
          },
          {
            userId: users[1]._id,
            username: users[1].username,
            amount: 7500,
            timestamp: new Date(oneHourAgo.getTime() + 20 * 60 * 1000)
          }
        ]
      },

      // Upcoming auction 1
      {
        productName: 'Rare Baseball Card Collection',
        product: {
          name: 'Rare Baseball Card Collection',
          description: 'Complete set of 1952 Topps baseball cards including Mickey Mantle rookie card.',
          category: 'Collectibles'
        },
        startingPrice: 2000,
        currentPrice: 2000,
        scheduledStartTime: oneHourFromNow,
        endTime: twoHoursFromNow,
        status: 'upcoming',
        bidHistory: []
      },

      // Upcoming auction 2
      {
        productName: 'Antique Persian Rug',
        product: {
          name: 'Antique Persian Rug',
          description: 'Handwoven Persian rug from the 18th century with intricate patterns.',
          category: 'Antiques'
        },
        startingPrice: 3000,
        currentPrice: 3000,
        scheduledStartTime: twoHoursFromNow,
        endTime: threeHoursFromNow,
        status: 'upcoming',
        bidHistory: []
      },

      // Closed auction (completed normally)
      {
        productName: 'Classic Guitar Collection',
        product: {
          name: 'Classic Guitar Collection',
          description: 'Three vintage guitars: 1959 Gibson Les Paul, 1963 Fender Stratocaster, and 1965 Martin D-28.',
          category: 'Musical Instruments'
        },
        startingPrice: 8000,
        currentPrice: 12500,
        scheduledStartTime: twoHoursAgo,
        endTime: oneHourAgo,
        status: 'closed',
        bidHistory: [
          {
            userId: users[1]._id,
            username: users[1].username,
            amount: 8500,
            timestamp: new Date(twoHoursAgo.getTime() + 5 * 60 * 1000)
          },
          {
            userId: users[2]._id,
            username: users[2].username,
            amount: 9000,
            timestamp: new Date(twoHoursAgo.getTime() + 15 * 60 * 1000)
          },
          {
            userId: users[3]._id,
            username: users[3].username,
            amount: 10000,
            timestamp: new Date(twoHoursAgo.getTime() + 25 * 60 * 1000)
          },
          {
            userId: users[2]._id,
            username: users[2].username,
            amount: 12500,
            timestamp: new Date(twoHoursAgo.getTime() + 45 * 60 * 1000)
          }
        ]
      },

      // Another closed auction
      {
        productName: 'Rare Coin Collection',
        product: {
          name: 'Rare Coin Collection',
          description: 'Collection of rare American silver dollars from 1878-1921.',
          category: 'Collectibles'
        },
        startingPrice: 1500,
        currentPrice: 2800,
        scheduledStartTime: new Date(twoHoursAgo.getTime() - 60 * 60 * 1000),
        endTime: twoHoursAgo,
        status: 'closed',
        bidHistory: [
          {
            userId: users[1]._id,
            username: users[1].username,
            amount: 1600,
            timestamp: new Date(twoHoursAgo.getTime() - 50 * 60 * 1000)
          },
          {
            userId: users[3]._id,
            username: users[3].username,
            amount: 2000,
            timestamp: new Date(twoHoursAgo.getTime() - 30 * 60 * 1000)
          },
          {
            userId: users[2]._id,
            username: users[2].username,
            amount: 2800,
            timestamp: new Date(twoHoursAgo.getTime() - 10 * 60 * 1000)
          }
        ]
      },

      // Cancelled auction
      {
        productName: 'Art Painting (Cancelled)',
        product: {
          name: 'Art Painting (Cancelled)',
          description: 'Original oil painting - auction cancelled due to authenticity concerns.',
          category: 'Art'
        },
        startingPrice: 1000,
        currentPrice: 1000,
        scheduledStartTime: new Date(oneHourAgo.getTime() - 30 * 60 * 1000),
        endTime: new Date(oneHourAgo.getTime() + 30 * 60 * 1000),
        status: 'cancelled',
        bidHistory: []
      }
    ]);

    console.log('Auctions created:', auctions.length);
    console.log('Seed data created successfully!');
    
    // Log the auction statuses for verification
    auctions.forEach(auction => {
      console.log(`${auction.title}: ${auction.status}`);
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