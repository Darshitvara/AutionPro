require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const User = require('./models/User');
const Auction = require('./models/Auction');

const seedData = async () => {
    try {
        await connectDB();
        console.log('🌱 Seeding database with comprehensive sample data...');

        // Clear existing data
        await User.deleteMany({});
        await Auction.deleteMany({});
        console.log('Cleared existing data');

        // Create diverse sample users
        const users = await Promise.all([
            // Admin users
            User.create({
                username: 'admin',
                email: 'admin@example.com',
                password: 'admin123',
                role: 'admin',
                walletBalance: 500000
            }),
            User.create({
                username: 'auction_master',
                email: 'auctionmaster@example.com',
                password: 'admin123',
                role: 'admin',
                walletBalance: 1000000
            }),
            
            // Regular users with different profiles
            User.create({
                username: 'john_doe',
                email: 'john@example.com',
                password: 'password123',
                walletBalance: 75000
            }),
            User.create({
                username: 'jane_smith',
                email: 'jane@example.com',
                password: 'password123',
                walletBalance: 120000
            }),
            User.create({
                username: 'mike_wilson',
                email: 'mike@example.com',
                password: 'password123',
                walletBalance: 50000
            }),
            User.create({
                username: 'sarah_connor',
                email: 'sarah@example.com',
                password: 'password123',
                walletBalance: 200000
            }),
            User.create({
                username: 'alex_tech',
                email: 'alex@example.com',
                password: 'password123',
                walletBalance: 80000
            }),
            User.create({
                username: 'emma_collector',
                email: 'emma@example.com',
                password: 'password123',
                walletBalance: 300000
            }),
            User.create({
                username: 'david_buyer',
                email: 'david@example.com',
                password: 'password123',
                walletBalance: 150000
            }),
            User.create({
                username: 'lisa_art',
                email: 'lisa@example.com',
                password: 'password123',
                walletBalance: 250000
            })
        ]);

        console.log(`✅ Created ${users.length} users`);

        // Current time for calculating auction times
        const now = new Date();

        // Create comprehensive auction data with different states
        const auctions = await Promise.all([
            
            // === CURRENTLY RUNNING AUCTIONS (Live) ===
            
            // Hot Electronics - Currently Live
            Auction.create({
                productName: 'iPhone 15 Pro Max',
                product: {
                    name: 'iPhone 15 Pro Max - Natural Titanium',
                    description: 'Latest iPhone with advanced camera system, titanium design, and A17 Pro chip. Brand new with complete warranty.',
                    image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-max-naturaltitanium-select-202309',
                    category: 'Electronics'
                },
                startingPrice: 120000,
                currentPrice: 135000,
                highestBidder: 'alex_tech',
                highestBidderId: users.find(u => u.username === 'alex_tech')._id,
                durationMinutes: 15,
                startTime: new Date(now.getTime() - 5 * 60 * 1000), // Started 5 minutes ago
                endTime: new Date(now.getTime() + 10 * 60 * 1000), // Ends in 10 minutes
                bids: [
                    {
                        userId: users.find(u => u.username === 'john_doe')._id,
                        username: 'john_doe',
                        amount: 125000,
                        timestamp: new Date(now.getTime() - 4 * 60 * 1000)
                    },
                    {
                        userId: users.find(u => u.username === 'sarah_connor')._id,
                        username: 'sarah_connor',
                        amount: 130000,
                        timestamp: new Date(now.getTime() - 2 * 60 * 1000)
                    },
                    {
                        userId: users.find(u => u.username === 'alex_tech')._id,
                        username: 'alex_tech',
                        amount: 135000,
                        timestamp: new Date(now.getTime() - 1 * 60 * 1000)
                    }
                ]
            }),

            Auction.create({
                productName: 'MacBook Pro M3 Max',
                product: {
                    name: 'MacBook Pro 16" M3 Max',
                    description: 'Powerful laptop with M3 Max chip, 36GB unified memory, and 1TB SSD. Perfect for professional work and creative tasks.',
                    image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp16-spacegray-select-202310',
                    category: 'Electronics'
                },
                startingPrice: 250000,
                currentPrice: 275000,
                highestBidder: 'emma_collector',
                highestBidderId: users.find(u => u.username === 'emma_collector')._id,
                durationMinutes: 20,
                startTime: new Date(now.getTime() - 8 * 60 * 1000), // Started 8 minutes ago
                endTime: new Date(now.getTime() + 12 * 60 * 1000), // Ends in 12 minutes
                bids: [
                    {
                        userId: users.find(u => u.username === 'jane_smith')._id,
                        username: 'jane_smith',
                        amount: 260000,
                        timestamp: new Date(now.getTime() - 6 * 60 * 1000)
                    },
                    {
                        userId: users.find(u => u.username === 'david_buyer')._id,
                        username: 'david_buyer',
                        amount: 270000,
                        timestamp: new Date(now.getTime() - 3 * 60 * 1000)
                    },
                    {
                        userId: users.find(u => u.username === 'emma_collector')._id,
                        username: 'emma_collector',
                        amount: 275000,
                        timestamp: new Date(now.getTime() - 1 * 60 * 1000)
                    }
                ]
            }),

            Auction.create({
                productName: 'Gaming Setup Bundle',
                product: {
                    name: 'Complete Gaming Setup - RTX 4080 PC',
                    description: 'High-end gaming PC with RTX 4080, i7-13700K, 32GB RAM, and 27" 4K monitor. Ready for any game at maximum settings.',
                    image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
                    category: 'Gaming'
                },
                startingPrice: 180000,
                currentPrice: 195000,
                highestBidder: 'mike_wilson',
                highestBidderId: users.find(u => u.username === 'mike_wilson')._id,
                durationMinutes: 25,
                startTime: new Date(now.getTime() - 3 * 60 * 1000), // Started 3 minutes ago
                endTime: new Date(now.getTime() + 22 * 60 * 1000), // Ends in 22 minutes
                bids: [
                    {
                        userId: users.find(u => u.username === 'alex_tech')._id,
                        username: 'alex_tech',
                        amount: 185000,
                        timestamp: new Date(now.getTime() - 2 * 60 * 1000)
                    },
                    {
                        userId: users.find(u => u.username === 'mike_wilson')._id,
                        username: 'mike_wilson',
                        amount: 195000,
                        timestamp: new Date(now.getTime() - 30 * 1000)
                    }
                ]
            }),

            // === UPCOMING AUCTIONS (Scheduled) ===
            
            Auction.create({
                productName: 'Vintage Rolex Submariner',
                product: {
                    name: 'Rolex Submariner 1965 - Vintage Collectible',
                    description: 'Rare vintage Rolex Submariner from 1965. Excellent condition with original box and papers. A true collector\'s piece.',
                    image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400',
                    category: 'Luxury Watches'
                },
                startingPrice: 500000,
                currentPrice: 500000,
                durationMinutes: 30,
                startTime: new Date(now.getTime() + 30 * 60 * 1000), // Starts in 30 minutes
                endTime: new Date(now.getTime() + 60 * 60 * 1000), // Ends in 60 minutes
                isActive: false
            }),

            Auction.create({
                productName: 'Tesla Model Y Performance',
                product: {
                    name: 'Tesla Model Y Performance 2024',
                    description: '2024 Tesla Model Y Performance in Pearl White. Full self-driving capability, premium interior, and 20" wheels.',
                    image: 'https://images.unsplash.com/photo-1617704548623-340376564e68?w=400',
                    category: 'Automobiles'
                },
                startingPrice: 4500000,
                currentPrice: 4500000,
                durationMinutes: 60,
                startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // Starts in 2 hours
                endTime: new Date(now.getTime() + 3 * 60 * 60 * 1000), // Ends in 3 hours
                isActive: false
            }),

            Auction.create({
                productName: 'Hermès Birkin Bag',
                product: {
                    name: 'Hermès Birkin 35 - Togo Leather',
                    description: 'Authentic Hermès Birkin 35 in black Togo leather with gold hardware. Comes with original box, dust bag, and authenticity card.',
                    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400',
                    category: 'Luxury Fashion'
                },
                startingPrice: 800000,
                currentPrice: 800000,
                durationMinutes: 45,
                startTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // Starts in 4 hours
                endTime: new Date(now.getTime() + 4.75 * 60 * 60 * 1000), // Ends in 4.75 hours
                isActive: false
            }),

            Auction.create({
                productName: 'Original Banksy Artwork',
                product: {
                    name: 'Banksy "Girl with Balloon" - Limited Print',
                    description: 'Authentic Banksy limited edition print "Girl with Balloon" with certificate of authenticity. Framed and ready to display.',
                    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
                    category: 'Art & Collectibles'
                },
                startingPrice: 350000,
                currentPrice: 350000,
                durationMinutes: 40,
                startTime: new Date(now.getTime() + 6 * 60 * 60 * 1000), // Starts in 6 hours
                endTime: new Date(now.getTime() + 6.67 * 60 * 60 * 1000), // Ends in 6.67 hours
                isActive: false
            }),

            // === ENDED AUCTIONS (Completed) ===
            
            Auction.create({
                productName: 'Samsung Galaxy S24 Ultra',
                product: {
                    name: 'Samsung Galaxy S24 Ultra 512GB',
                    description: 'Samsung Galaxy S24 Ultra with S Pen, excellent camera system, and 512GB storage. Titanium finish.',
                    image: 'https://images.samsung.com/is/image/samsung/p6pim/in/2401/gallery/in-galaxy-s24-ultra-s928-sm-s928bzkeins-thumb-539573146?w=400',
                    category: 'Electronics'
                },
                startingPrice: 100000,
                currentPrice: 118000,
                highestBidder: 'jane_smith',
                highestBidderId: users.find(u => u.username === 'jane_smith')._id,
                durationMinutes: 15,
                startTime: new Date(now.getTime() - 25 * 60 * 1000), // Started 25 minutes ago
                endTime: new Date(now.getTime() - 10 * 60 * 1000), // Ended 10 minutes ago
                isActive: false,
                bids: [
                    {
                        userId: users.find(u => u.username === 'mike_wilson')._id,
                        username: 'mike_wilson',
                        amount: 105000,
                        timestamp: new Date(now.getTime() - 20 * 60 * 1000)
                    },
                    {
                        userId: users.find(u => u.username === 'alex_tech')._id,
                        username: 'alex_tech',
                        amount: 112000,
                        timestamp: new Date(now.getTime() - 15 * 60 * 1000)
                    },
                    {
                        userId: users.find(u => u.username === 'jane_smith')._id,
                        username: 'jane_smith',
                        amount: 118000,
                        timestamp: new Date(now.getTime() - 12 * 60 * 1000)
                    }
                ]
            }),

            Auction.create({
                productName: 'PlayStation 5 Pro',
                product: {
                    name: 'PlayStation 5 Pro Console Bundle',
                    description: 'Sony PlayStation 5 Pro with extra controller, charging station, and 5 premium games. Perfect gaming package.',
                    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400',
                    category: 'Gaming'
                },
                startingPrice: 70000,
                currentPrice: 85000,
                highestBidder: 'david_buyer',
                highestBidderId: users.find(u => u.username === 'david_buyer')._id,
                durationMinutes: 20,
                startTime: new Date(now.getTime() - 35 * 60 * 1000), // Started 35 minutes ago
                endTime: new Date(now.getTime() - 15 * 60 * 1000), // Ended 15 minutes ago
                isActive: false,
                bids: [
                    {
                        userId: users.find(u => u.username === 'mike_wilson')._id,
                        username: 'mike_wilson',
                        amount: 75000,
                        timestamp: new Date(now.getTime() - 30 * 60 * 1000)
                    },
                    {
                        userId: users.find(u => u.username === 'alex_tech')._id,
                        username: 'alex_tech',
                        amount: 80000,
                        timestamp: new Date(now.getTime() - 25 * 60 * 1000)
                    },
                    {
                        userId: users.find(u => u.username === 'david_buyer')._id,
                        username: 'david_buyer',
                        amount: 85000,
                        timestamp: new Date(now.getTime() - 18 * 60 * 1000)
                    }
                ]
            }),

            Auction.create({
                productName: 'Canon EOS R5 Camera',
                product: {
                    name: 'Canon EOS R5 Mirrorless Camera Kit',
                    description: 'Professional Canon EOS R5 with 24-105mm lens, extra batteries, memory cards, and premium camera bag.',
                    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400',
                    category: 'Photography'
                },
                startingPrice: 200000,
                currentPrice: 235000,
                highestBidder: 'lisa_art',
                highestBidderId: users.find(u => u.username === 'lisa_art')._id,
                durationMinutes: 25,
                startTime: new Date(now.getTime() - 45 * 60 * 1000), // Started 45 minutes ago
                endTime: new Date(now.getTime() - 20 * 60 * 1000), // Ended 20 minutes ago
                isActive: false,
                bids: [
                    {
                        userId: users.find(u => u.username === 'emma_collector')._id,
                        username: 'emma_collector',
                        amount: 210000,
                        timestamp: new Date(now.getTime() - 40 * 60 * 1000)
                    },
                    {
                        userId: users.find(u => u.username === 'sarah_connor')._id,
                        username: 'sarah_connor',
                        amount: 225000,
                        timestamp: new Date(now.getTime() - 30 * 60 * 1000)
                    },
                    {
                        userId: users.find(u => u.username === 'lisa_art')._id,
                        username: 'lisa_art',
                        amount: 235000,
                        timestamp: new Date(now.getTime() - 22 * 60 * 1000)
                    }
                ]
            })
        ]);

        console.log(`✅ Created ${auctions.length} auctions`);

        // Count auction states
        const liveAuctions = auctions.filter(a => a.isActive && new Date() < a.endTime).length;
        const upcomingAuctions = auctions.filter(a => !a.isActive && new Date() < a.startTime).length;
        const endedAuctions = auctions.filter(a => !a.isActive && new Date() > a.endTime).length;

        console.log('\n📊 Database seeded successfully with comprehensive sample data!');
        console.log('\n👥 Sample Users:');
        users.forEach(user => {
            console.log(`   - ${user.username} (${user.email}) - Role: ${user.role} - Wallet: ₹${user.walletBalance.toLocaleString('en-IN')}`);
        });

        console.log('\n🏷️ Auction Summary:');
        console.log(`   📍 Live Auctions: ${liveAuctions}`);
        console.log(`   ⏰ Upcoming Auctions: ${upcomingAuctions}`);
        console.log(`   ✅ Ended Auctions: ${endedAuctions}`);

        console.log('\n🎯 Live Auctions:');
        auctions.filter(a => a.isActive && new Date() < a.endTime).forEach(auction => {
            console.log(`   🔥 ${auction.productName} - Current: ₹${auction.currentPrice.toLocaleString('en-IN')} - Leader: ${auction.highestBidder || 'None'}`);
        });

        console.log('\n⏳ Upcoming Auctions:');
        auctions.filter(a => !a.isActive && new Date() < a.startTime).forEach(auction => {
            const startsIn = Math.ceil((auction.startTime - new Date()) / (1000 * 60));
            console.log(`   ⏰ ${auction.productName} - Starting: ₹${auction.startingPrice.toLocaleString('en-IN')} - Starts in: ${startsIn} minutes`);
        });

        console.log('\n🏆 Recently Ended Auctions:');
        auctions.filter(a => !a.isActive && new Date() > a.endTime).forEach(auction => {
            console.log(`   ✅ ${auction.productName} - Final: ₹${auction.currentPrice.toLocaleString('en-IN')} - Winner: ${auction.highestBidder || 'No bids'}`);
        });

        console.log('\n🔑 Test Credentials:');
        console.log('   🛡️  Admin: admin@example.com / admin123');
        console.log('   🛡️  Admin: auctionmaster@example.com / admin123');
        console.log('   👤 User: john@example.com / password123');
        console.log('   👤 User: jane@example.com / password123');
        console.log('   👤 User: alex@example.com / password123');

        console.log('\n🎉 Ready to explore the auction system with realistic data!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedData();