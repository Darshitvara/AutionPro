const mongoose = require('mongoose');
const User = require('./models/User');
const Auction = require('./models/Auction');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auction-system');

    // Clear only auction data as requested
    await Auction.deleteMany({});

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
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    // Helper to build Unsplash source URLs for visible, relevant images
    const img = (keyword) => `https://source.unsplash.com/800x600/?${encodeURIComponent(keyword)}`;

    // Build 20 auctions with a realistic mix of statuses and times
    const baseAuctions = [
      { name: 'Omega Speedmaster Professional', cat: 'Watches', desc: 'Iconic chronograph known as the Moonwatch.', start: 2500, type: 'live', img: img('omega speedmaster watch') },
      { name: 'Apple MacBook Pro 16"', cat: 'Electronics', desc: 'M2 Pro, 32GB RAM, 1TB SSD, space gray.', start: 1200, type: 'live', img: img('laptop macbook pro') },
      { name: 'Canon EOS R6 Camera Kit', cat: 'Photography', desc: 'Mirrorless camera with 24-105mm lens.', start: 900, type: 'live', img: img('camera canon') },
      { name: 'Rolex Submariner Date', cat: 'Watches', desc: 'Stainless steel, black dial, ceramic bezel.', start: 7000, type: 'live', img: img('rolex submariner') },

      { name: 'Mid-Century Lounge Chair', cat: 'Furniture', desc: 'Walnut veneer with leather upholstery.', start: 600, type: 'upcoming', img: img('mid century lounge chair') },
      { name: 'Antique Persian Rug', cat: 'Antiques', desc: 'Handwoven rug with intricate medallion pattern.', start: 1500, type: 'upcoming', img: img('persian rug') },
      { name: 'Sony PlayStation 5 Bundle', cat: 'Gaming', desc: 'PS5 Disc Edition with two controllers.', start: 400, type: 'upcoming', img: img('playstation 5 console') },
      { name: 'Air Jordan 1 “Chicago”', cat: 'Fashion', desc: 'OG colorway, pristine condition, boxed.', start: 300, type: 'upcoming', img: img('air jordan 1 chicago shoes') },
      { name: 'Specialized Road Bike', cat: 'Sports', desc: 'Carbon frame, 11-speed, lightweight build.', start: 800, type: 'upcoming', img: img('road bike specialized') },
      { name: 'Nintendo Switch OLED', cat: 'Gaming', desc: 'Handheld console with OLED screen.', start: 250, type: 'upcoming', img: img('nintendo switch oled') },
      { name: 'Dyson V15 Detect Vacuum', cat: 'Home Appliances', desc: 'Cordless vacuum with laser dust detection.', start: 350, type: 'upcoming', img: img('dyson vacuum v15') },
      { name: 'iPhone 15 Pro Max', cat: 'Electronics', desc: 'Titanium, 256GB, blue natural titanium.', start: 1000, type: 'upcoming', img: img('iphone 15 pro max') },

      { name: 'Gibson Les Paul Standard 1959', cat: 'Musical Instruments', desc: 'Sunburst finish, excellent resonance.', start: 5000, type: 'closed', img: img('guitar gibson les paul') },
      { name: 'Rare Coin Collection', cat: 'Collectibles', desc: 'Morgan silver dollars set 1878–1921.', start: 1200, type: 'closed', img: img('rare coin collection') },
      { name: 'Hermès Birkin 30', cat: 'Luxury', desc: 'Togo leather, gold hardware, etoupe.', start: 9000, type: 'closed', img: img('hermes birkin bag') },
      { name: 'Lego Millennium Falcon UCS', cat: 'Toys', desc: 'Collectible set, complete with box.', start: 700, type: 'closed', img: img('lego millennium falcon') },
      { name: 'Signed Football Jersey', cat: 'Sports Memorabilia', desc: 'Signed by a star quarterback, COA included.', start: 400, type: 'closed', img: img('signed football jersey') },
      { name: 'Vintage Vinyl Records Lot', cat: 'Music', desc: 'Classic rock albums, well preserved.', start: 200, type: 'closed', img: img('vinyl records collection') },
      { name: 'GoPro HERO12 Black', cat: 'Photography', desc: 'Action camera with accessories kit.', start: 300, type: 'closed', img: img('gopro action camera') },
      { name: 'Original Oil Painting', cat: 'Art', desc: 'Landscape scene, framed, artist-signed.', start: 1000, type: 'cancelled', img: img('oil painting landscape') }
    ];

    const auctionsToInsert = baseAuctions.map((item, idx) => {
      // Time math
      const nowTs = now.getTime();
      const minute = 60 * 1000;
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

      if (item.type === 'upcoming') {
        scheduledStartTime = new Date(nowTs + startOffset);
        endTime = new Date(nowTs + startOffset + 30 * minute);
      } else if (item.type === 'live') {
        scheduledStartTime = new Date(nowTs - startOffset);
        endTime = new Date(nowTs + (20 + (idx % 10)) * minute);
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
      } else if (item.type === 'cancelled') {
        scheduledStartTime = new Date(nowTs - startOffset);
        endTime = new Date(nowTs + 30 * minute);
        status = 'cancelled';
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