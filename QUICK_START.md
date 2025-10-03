# 🚀 Quick Start Guide

## Real-Time Auction System

### Prerequisites
- Node.js v16 or higher
- npm or yarn
- Modern web browser

---

## ⚡ Quick Setup (5 minutes)

### 1. Backend Setup
```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Start the server
npm start
```

✅ Backend running on **http://localhost:5000**

---

### 2. Frontend Setup
```bash
# Open new terminal, navigate to frontend
cd frontend

# Install dependencies  
npm install

# Start development server
npm run dev
```

✅ Frontend running on **http://localhost:5173**

---

## 🎮 Testing the Application

### Step 1: Register First User
1. Open **http://localhost:5173** in Chrome
2. Click "**Register here**"
3. Fill in:
   - Username: `john`
   - Email: `john@example.com`
   - Password: `password123`
4. Click "**Create Account**"
5. ✅ You're automatically logged in!

### Step 2: Register Second User  
1. Open **http://localhost:5173** in Firefox (or Incognito)
2. Click "**Register here**"
3. Fill in:
   - Username: `jane`
   - Email: `jane@example.com`
   - Password: `password123`
4. Click "**Create Account**"
5. ✅ See both users in participants list!

### Step 3: Place Bids
1. **John's browser**: Enter `55000` → Place Bid
2. Watch **Jane's browser** update instantly! 🎉
3. **Jane's browser**: Enter `60000` → Place Bid
4. Watch **John's browser** update instantly! 🎉

### Step 4: Watch the Auction End
1. Wait for timer to reach 00:00
2. See winner announcement! 🏆
3. Bidding is locked

---

## 🎯 What to Look For

### ✅ Real-Time Features
- Instant bid updates across all browsers
- Live participant count
- Countdown timer synchronization
- Notifications for all events

### ✅ Authentication
- JWT tokens stored securely
- Token persists on page refresh
- Logout clears session
- Protected WebSocket connections

### ✅ UI/UX
- Smooth animations
- Toast notifications
- Form validation
- Responsive design

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Port 5000 already in use?
# Kill the process:
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -ti:5000 | xargs kill
```

### Frontend won't connect
```bash
# Check backend is running on port 5000
# Check browser console for errors
# Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Can't register/login
```bash
# Check backend terminal for errors
# Verify .env file exists in backend/
# Check Network tab in browser DevTools
```

---

## 📱 Quick Feature Test

| Feature | Test | Expected Result |
|---------|------|-----------------|
| Register | Create new account | Success toast, auto-login |
| Login | Use existing credentials | Welcome message, join auction |
| Bid | Enter amount > current | Bid accepted, broadcast to all |
| Invalid Bid | Enter amount ≤ current | Error toast, bid rejected |
| Timer | Wait for countdown | Updates every second |
| Auction End | Timer reaches 0:00 | Winner announced, bidding locked |
| Participants | Multiple users join | Count updates, names listed |
| Logout | Click logout button | Redirected to login |
| Token Persist | Refresh page | Stay logged in |

---

## 🎨 UI Preview

### Colors
- **Primary**: Purple (#6366f1)
- **Secondary**: Violet (#8b5cf6)
- **Success**: Green (#10b981)
- **Danger**: Red (#ef4444)

### Key Screens
1. **Login**: Clean form with email + password
2. **Register**: Form with username, email, passwords
3. **Auction**: Main interface with timer, bids, participants

---

## 📖 User Guide

### For Bidders
1. **Register** your account
2. **Join** the auction (automatic)
3. **Watch** the countdown timer
4. **Place** bids higher than current price
5. **Win** when you have highest bid at time's end

### For Developers
1. **Backend**: MVC architecture in `/backend`
2. **Frontend**: React components in `/frontend/src`
3. **API Docs**: See `DEVELOPMENT_SUMMARY.md`

---

## 🔑 Default Credentials (Testing)

No default users - you must register new ones!

Suggested test users:
```
User 1:
- Username: alice
- Email: alice@test.com
- Password: test123

User 2:
- Username: bob
- Email: bob@test.com
- Password: test123
```

---

## 🌟 Key Commands

```bash
# Backend
npm start          # Start server
npm run dev        # Start with nodemon

# Frontend  
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

---

## 📊 Performance Tips

- **Multiple Users**: Open in different browsers (not just tabs)
- **Network**: All browsers must connect to same backend
- **Testing**: Use browser DevTools to monitor WebSocket connection

---

## 🎉 Success Indicators

✅ Backend shows: "Auction backend running on http://localhost:5000"
✅ Frontend shows: "ready in XXX ms" with local URL
✅ Browser shows: Login/Register page
✅ After login: Auction room with timer
✅ Multiple browsers: Participants count increases
✅ Place bid: Toast notification + updates in other browsers

---

## 🆘 Need Help?

### Check These Files
1. `DEVELOPMENT_SUMMARY.md` - Complete project overview
2. `backend/README.md` - Backend architecture
3. `frontend/README.md` - Frontend architecture

### Common Issues
- **CORS errors**: Backend config (already fixed)
- **Auth errors**: Token in localStorage + handshake
- **Socket errors**: Check token in browser DevTools > Application > Local Storage

---

## 🚀 Next Steps

After testing:
1. Add database (MongoDB/PostgreSQL)
2. Deploy to production (Vercel + Railway/Heroku)
3. Add more features (see DEVELOPMENT_SUMMARY.md)

---

**🎊 Congratulations! You now have a fully functional real-time auction system!** 

Enjoy testing and feel free to extend it with more features! 🚀
