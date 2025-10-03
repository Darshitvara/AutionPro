# Backend MVC Architecture

## 📁 Project Structure

```
backend/
├── config/
│   └── config.js                 # Configuration settings
├── controllers/
│   ├── authController.js         # Authentication logic
│   └── auctionController.js      # Auction CRUD logic
├── middleware/
│   ├── authMiddleware.js         # JWT authentication middleware
│   └── errorMiddleware.js        # Error handling middleware
├── models/
│   ├── User.js                   # User model & business logic
│   └── Auction.js                # Auction model & business logic
├── routes/
│   ├── authRoutes.js             # Authentication routes
│   └── auctionRoutes.js          # Auction routes
├── services/
│   └── socketService.js          # Socket.IO real-time service
├── utils/
│   └── jwt.js                    # JWT utility functions
├── .env                          # Environment variables
├── package.json
└── server.js                     # Application entry point
```

## 🏗️ Architecture Overview

### **Models** (Data Layer)
- Handle data structure and business logic
- `User.js`: User creation, authentication, validation
- `Auction.js`: Auction management, bidding logic, state management

### **Controllers** (Business Logic Layer)
- Handle request/response logic
- `authController.js`: Register, login, verify user
- `auctionController.js`: CRUD operations for auctions

### **Routes** (API Layer)
- Define API endpoints
- `authRoutes.js`: `/api/auth/*` endpoints
- `auctionRoutes.js`: `/api/auctions/*` endpoints

### **Middleware** (Cross-cutting Concerns)
- `authMiddleware.js`: JWT verification for protected routes
- `errorMiddleware.js`: Centralized error handling

### **Services** (External Services)
- `socketService.js`: Socket.IO real-time bidding functionality

### **Utils** (Helper Functions)
- `jwt.js`: Token generation and verification

## 🔐 Authentication Flow

### Registration
1. Client sends POST to `/api/auth/register`
2. `authController.register()` validates input
3. `User.create()` hashes password and stores user
4. JWT token generated and returned

### Login
1. Client sends POST to `/api/auth/login`
2. `authController.login()` validates credentials
3. `User.verifyPassword()` checks password
4. JWT token generated and returned

### Protected Routes
1. Client sends request with `Authorization: Bearer <token>` header
2. `authMiddleware` verifies token
3. User info attached to `req.user`
4. Route handler executes

### Socket.IO Authentication
1. Client connects with token in `auth` handshake
2. `socketAuthMiddleware` verifies token
3. User info attached to `socket.user`
4. Socket events handled

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify token (protected)
- `GET /api/auth/profile` - Get user profile (protected)

### Auctions
- `GET /api/auctions` - Get all auctions
- `GET /api/auctions/:id` - Get auction by ID
- `POST /api/auctions` - Create auction (protected)
- `DELETE /api/auctions/:id` - Delete auction (protected)

### Health Check
- `GET /api/health` - Server health status

## 🔌 Socket.IO Events

### Client → Server
- `join-auction` - Join auction room
  ```javascript
  { auctionId: string }
  ```
- `place-bid` - Place a bid
  ```javascript
  { auctionId: string, bidAmount: number }
  ```
- `request-state` - Request current state
  ```javascript
  { auctionId: string }
  ```

### Server → Client
- `auction-state` - Current auction state
- `user-joined` - New user joined
- `user-left` - User left
- `bid-placed` - New bid placed
- `bid-rejected` - Bid validation failed
- `timer-update` - Timer countdown
- `auction-ended` - Auction finished
- `notification` - System notification
- `error` - Error message

## 🔧 Configuration

### Environment Variables (.env)
```
PORT=5000
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Config (config/config.js)
Centralizes all configuration with defaults

## 🚀 Running the Server

```bash
# Install dependencies
npm install

# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## 📝 Key Features

### ✅ MVC Architecture
- Clear separation of concerns
- Maintainable and scalable code structure
- Easy to test individual components

### ✅ JWT Authentication
- Secure token-based authentication
- Protected routes and Socket.IO connections
- Token expiration handling

### ✅ Real-time Communication
- Socket.IO for live bidding
- Room-based architecture
- Automatic cleanup on disconnect

### ✅ Error Handling
- Centralized error middleware
- Consistent error responses
- Development/Production modes

### ✅ Validation
- Input validation in controllers
- Business logic validation in models
- Authentication validation in middleware

## 🔄 Data Flow Example: Placing a Bid

1. **Client** emits `place-bid` event via Socket.IO
2. **Socket Middleware** verifies JWT token
3. **Socket Service** receives event with user info
4. **Auction Model** validates and processes bid
5. **Socket Service** broadcasts result to all participants
6. **Clients** receive real-time updates

## 📚 Best Practices Implemented

- ✅ Separation of Concerns (MVC)
- ✅ DRY (Don't Repeat Yourself)
- ✅ Single Responsibility Principle
- ✅ Middleware for cross-cutting concerns
- ✅ Centralized error handling
- ✅ Environment-based configuration
- ✅ Secure password hashing
- ✅ JWT for stateless authentication
- ✅ Input validation
- ✅ Proper HTTP status codes

## 🔮 Future Enhancements

- Database integration (MongoDB/PostgreSQL)
- Redis for session management
- Rate limiting
- API documentation (Swagger)
- Unit and integration tests
- Logging system (Winston/Morgan)
- File upload for product images
- Email notifications
- Admin dashboard
- Payment integration
