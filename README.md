# Real-Time Auction System

A **production-ready** real-time auction system built with **Node.js**, **Express**, **Socket.IO**, **MongoDB**, and **React** with JWT authentication and elegant modern UI.

## 🚀 Features

- **Real-Time Bidding**: Server-confirmed, instant updates across all clients (no manual refresh)
- **Authentication & RBAC**: JWT login/registration with role-based access (admin controls)
- **MongoDB Integration**: Persistent storage with bid history and users
- **Server-Driven Countdown**: Visual timer with warning animations driven by server events
- **Bid Validation**: Prevents invalid bids and ensures fairness
- **Winner Announcement**: Automatic winner declaration when auction ends
- **Live Notifications**: Real-time updates for all auction events
- **Participants List**: See who's currently in the auction
- **Admin Controls**: Start/Stop auctions with in-app confirmation modals
- **Responsive Design**: Works beautifully on all devices
- **Elegant UI**: Modern glassmorphism design with smooth animations
- **MVC Architecture**: Clean, scalable backend structure
- **Production Ready**: Complete with database, authentication, and validation

## ➕ Additional Enhancements

- Authoritative updates only: frontend re-renders strictly on server events; optimistic UI and client-side timers removed.
- Immediate state broadcast: server emits the full updated `auction-state` right after a successful bid for zero-lag UI.
- Performance: atomic bid writes and trimmed live payloads (last 50 bids) to reduce latency and bandwidth.
- Admin UX: in-app Start/Stop confirmation modals with loading states and toasts (no browser alerts).
- UI polish: themed activity scrollbar and overflow-safe layouts for small screens.
- Data seeding: script wipes existing auctions and seeds 30 image-rich records with realistic schedules and histories.
- Socket robustness: reliable reconnects and transport fallback support.
- Focused listings: auctions page shows the first 10 records for a fast overview.

## 🗄️ Database Storage

✅ **Migrated from in-memory to MongoDB** for persistent storage!

- Users and auctions survive server restarts
- Professional database schemas
- Bid history tracking
- User management and authentication

## 📋 Project Structure

```
auction-system/
├── backend/           # Node.js + Express + Socket.IO server
│   ├── server.js
│   └── package.json
└── frontend/          # React + Vite application
    ├── src/
    │   ├── components/
    │   │   ├── Login.jsx
    │   │   ├── AuctionRoom.jsx
    │   │   ├── ProductCard.jsx
    │   │   ├── BidForm.jsx
    │   │   ├── WinnerAnnouncement.jsx
    │   │   ├── Notifications.jsx
    │   │   └── Participants.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- **MongoDB** (for database)

### 1. MongoDB Setup

**Install MongoDB:**
- Download from [MongoDB Official Site](https://www.mongodb.com/try/download/community)
- Install MongoDB Community Edition
- Start MongoDB service:
  ```bash
  # Windows (run as administrator)
  net start MongoDB
  ```

**Or use MongoDB Compass** (GUI tool) to manage your database visually.

### 2. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies (including Mongoose):
```bash
npm install
```

3. Create sample data in database:
```bash
npm run seed
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000` with MongoDB connection.

### 3. Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🗄️ Database Information

Your auction system now uses **MongoDB** for persistent storage:

- **Database**: `auction_system`
- **Collections**: `users`, `auctions`
- **Sample Data**: Created by `npm run seed`
- **Test Credentials**: 
  - Email: `john@example.com`
  - Password: `password123`

See `DATABASE_SETUP.md` for detailed database information.

## 🎮 How to Use

1. **Start MongoDB**: Ensure MongoDB service is running
2. **Start Both Servers**: Ensure both backend and frontend are running
2. **Open Browser**: Navigate to `http://localhost:5173`
3. **Enter Username**: Join the auction with your username
4. **Place Bids**: Enter an amount higher than the current bid
5. **Watch Live Updates**: See bids from other users in real-time
6. **Winner Announcement**: When the timer ends, the winner is announced

## 🔧 Configuration

### Backend Configuration (backend/server.js)

- **Port**: Default is 5000
- **Auction Duration**: Default is 2 minutes
- **Starting Price**: Configurable in the Auction constructor
- **Product Name**: Customizable

Example:
```javascript
const defaultAuction = new Auction('auction-1', 'Vintage Rolex Watch', 50000, 2);
```

### Frontend Configuration (frontend/src/App.jsx)

- **Socket URL**: Default is `http://localhost:5000`
- **Auction ID**: Default is 'auction-1'

## 🌟 Key Features Explained

### Real-Time Updates
- Uses Socket.IO for bidirectional communication
- Server-confirmed updates only: UI changes only after the server persists and broadcasts `auction-state`
- Live participant count

### Bid Validation
- Bids must be higher than current price
- Prevents bidding after auction ends
- Client and server-side validation

### Countdown Timer
- Server-driven timer (no client-side drift)
- Shows remaining time in MM:SS format
- Warning animation when < 10 seconds remain
- Automatically ends auction when time is up

### Notifications System
- **Info**: User joins/leaves
- **Success**: Bid placed successfully
- **Warning**: Auction ending soon
- **Error**: Invalid bid attempts

## 🎨 UI/UX Features

- **Gradient Background**: Modern purple gradient
- **Glass Morphism**: Translucent cards with shadows
- **Smooth Animations**: Fade-in, slide-in effects
- **Responsive Grid**: Adapts to all screen sizes
- **Color-Coded Status**: Visual indicators for auction state
- **Pulse Animations**: Warning effects on timer

## 🔮 Future Enhancements

- Multiple auction rooms support
- User profiles with bid history
- Payment integration
- Image upload for products
- Chat functionality
- Admin dashboard
- Database persistence
- Authentication with JWT

## 📝 API Endpoints

### REST API
- `GET /api/health` - Health check
- `GET /api/auctions` - List all auctions
- `GET /api/auctions/:id` - Get specific auction

### Socket.IO Events

#### Client → Server
- `join-auction` - Join an auction room
- `place-bid` - Place a bid
- `request-state` - Request current auction state

#### Server → Client
- `auction-state` - Current auction state
- `user-joined` - New user joined
- `user-left` - User left
- `bid-placed` - New bid placed
- `timer-update` - Timer update
- `auction-ended` - Auction finished
- `notification` - System notification
- `bid-rejected` - Bid validation failed

## 🐛 Troubleshooting

**Connection Issues:**
- Ensure backend is running on port 5000
- Check CORS settings in backend/server.js
- Verify Socket.IO version compatibility

**Build Issues:**
- Clear node_modules and reinstall
- Check Node.js version (v16+)
- Verify all dependencies are installed

## 📄 License

MIT License - Feel free to use this project for learning or commercial purposes.

## 👨‍💻 Developer

Built with ❤️ using React, Node.js, Express, and Socket.IO

---

**Happy Bidding! 🔨**
