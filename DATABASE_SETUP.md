# 🏪 Real-time Auction System - Database Setup

## 🗄️ Database Migration from In-Memory to MongoDB

Your auction system has been **successfully migrated** from in-memory storage to **MongoDB** for production-ready persistence!

## 📊 What Changed

### ✅ Before (In-Memory)
- Data stored in JavaScript `Map()` objects
- Lost all data when server restarted
- No persistence between sessions
- Limited scalability

### 🚀 After (MongoDB)
- Persistent database storage
- Data survives server restarts
- Scalable and production-ready
- Professional data modeling

## 🏗️ Database Schema

### 👤 User Model
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  walletBalance: Number (default: 10000),
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 🏷️ Auction Model
```javascript
{
  productName: String,
  startingPrice: Number,
  currentPrice: Number,
  highestBidder: String,
  highestBidderId: ObjectId,
  participants: [{
    socketId: String,
    userId: ObjectId,
    username: String,
    joinedAt: Date
  }],
  isActive: Boolean,
  durationMinutes: Number,
  startTime: Date,
  endTime: Date,
  bidHistory: [{
    userId: ObjectId,
    username: String,
    amount: Number,
    timestamp: Date
  }],
  warningShown: Boolean
}
```

## 🛠️ Setup Instructions

### 1. Install MongoDB

#### Windows
- Download from [MongoDB Official Site](https://www.mongodb.com/try/download/community)
- Install MongoDB Community Edition
- Start MongoDB service

#### Quick Start (MongoDB Compass)
- Download MongoDB Compass (GUI tool)
- Connect to `mongodb://localhost:27017`

### 2. Environment Configuration

The system uses these environment variables (already configured in `.env`):

```env
MONGODB_URI=mongodb://localhost:27017/auction_system
```

### 3. Seed Sample Data

Run this command to populate your database with sample data:

```bash
cd backend
npm run seed
```

This creates:
- 3 sample users (john@example.com, jane@example.com, mike@example.com)
- 3 sample auctions with different products
- All passwords: `password123`

## 🚀 Running the System

### Start MongoDB (if not auto-started)
```bash
# Windows (run as administrator)
net start MongoDB

# Or start MongoDB manually
mongod
```

### Start the Auction System
```bash
# Backend
cd backend
npm run dev

# Frontend (in new terminal)
cd frontend
npm run dev
```

## 🔧 Key Features

### 🔄 Automatic Migration
- All existing functionality preserved
- Same API endpoints and Socket.IO events
- Seamless transition from in-memory to database

### 🎯 Enhanced Features
- **Data Persistence**: Users and auctions survive server restarts
- **User Management**: Proper user registration and authentication
- **Bid History**: Complete tracking of all bids
- **Participant Tracking**: Real-time participant management
- **Auction Analytics**: Detailed auction state and statistics

### 🔒 Security
- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- Database injection protection

## 📱 API Endpoints

All existing endpoints work the same:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/auctions` - Get all auctions
- `GET /api/auctions/:id` - Get auction by ID
- `POST /api/auctions` - Create new auction
- `DELETE /api/auctions/:id` - Delete auction

## 🌐 Socket.IO Events

All real-time events remain the same:

- `join-auction` - Join auction room
- `place-bid` - Place a bid
- `bid-placed` - Bid successful notification
- `auction-ended` - Auction completion
- `timer-update` - Real-time countdown
- `user-joined/left` - Participant updates

## 🧪 Testing the Database

### 1. User Registration/Login
```bash
# Test user registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

### 2. View Database
- Open MongoDB Compass
- Connect to `mongodb://localhost:27017`
- Browse `auction_system` database
- View `users` and `auctions` collections

### 3. Check Data Persistence
1. Start the server
2. Register a user or create an auction
3. Stop the server
4. Restart the server
5. ✅ Data should still be there!

## 🔍 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB service
net start MongoDB
```

### Database Reset
```bash
# Clear all data and reseed
npm run seed
```

### View Logs
```bash
# Check server logs for database connection status
npm run dev
# Look for: "✅ MongoDB Connected: localhost:27017"
```

## 🎉 Migration Complete!

Your auction system now has:
- ✅ **Persistent Storage** - No more data loss
- ✅ **Production Ready** - Scalable architecture
- ✅ **Professional Database** - MongoDB with proper schemas
- ✅ **All Features Intact** - Same functionality, better persistence

The system is now ready for production deployment! 🚀