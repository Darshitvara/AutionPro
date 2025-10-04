import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import io from 'socket.io-client'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './components/LandingPage'
import ModernLogin from './components/ModernLogin'
import ModernRegister from './components/ModernRegister'
import ModernAuctionRoom from './components/ModernAuctionRoom'
import ModernAuctionList from './components/ModernAuctionList'
import AdminDashboard from './components/AdminDashboard'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0A0A0A, #1a1a1a, #0A0A0A)' }}>
        <div className="animate-spin w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Admin Route Component
function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0A0A0A, #1a1a1a, #0A0A0A)' }}>
        <div className="animate-spin w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/auctions" replace />
  
  return children
}

// Auth Route Component (redirect if already logged in)
function AuthRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0A0A0A, #1a1a1a, #0A0A0A)' }}>
        <div className="animate-spin w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }
  
  return isAuthenticated ? <Navigate to="/auctions" replace /> : children
}

// Auction Room Wrapper
function AuctionRoomWrapper() {
  const { auctionId } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [socket, setSocket] = useState(null)
  const [auctionState, setAuctionState] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [participants, setParticipants] = useState([])
  
  // Check if we're in preview mode
  const urlParams = new URLSearchParams(window.location.search)
  const isPreviewMode = urlParams.get('mode') === 'preview'

  useEffect(() => {
    if (user && token && auctionId) {
      if (isPreviewMode) {
        // In preview mode, just fetch auction data without connecting to socket
        fetchAuctionData()
      } else {
        // Regular live auction mode with socket connection
        const newSocket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket'],
        })

        newSocket.on('connect', () => {
          console.log('Connected to auction:', auctionId)
          newSocket.emit('join-auction', { auctionId })
        })

        newSocket.on('auction-state', (state) => {
          console.log('Auction state received:', state)
          setAuctionState(state)
        })

        newSocket.on('participants-update', (participantsList) => {
          console.log('Participants update:', participantsList)
          setParticipants(participantsList)
        })

        newSocket.on('notification', (notification) => {
          addNotification(notification)
        })

        newSocket.on('bid-placed', (data) => {
          console.log('New bid placed:', data)
          addNotification({
            type: 'success',
            message: `${data.username} bid ₹${data.amount.toLocaleString()}`
          })
        })

        newSocket.on('auction-ended', (data) => {
          console.log('Auction ended:', data)
          addNotification({
            type: 'info',
            message: 'Auction has ended!'
          })
        })

        newSocket.on('error', (data) => {
          console.error('Socket error:', data.message)
          addNotification({
            type: 'error',
            message: data.message
          })
        })

        setSocket(newSocket)

        return () => {
          console.log('Disconnecting socket')
          newSocket.disconnect()
        }
      }
    }
  }, [user, token, auctionId, isPreviewMode])

  // Function to fetch auction data for preview mode
  const fetchAuctionData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/auctions/${auctionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      if (data.success) {
        // Create a preview state with frozen time and disabled bidding
        const previewState = {
          ...data.auction,
          remainingTime: 0, // Frozen time
          isActive: false,
          status: 'upcoming',
          currentPrice: data.auction.startingPrice || data.auction.currentPrice,
          highestBidder: null,
          participantCount: 0,
          isPreview: true
        }
        setAuctionState(previewState)
        setParticipants([]) // No live participants in preview
      }
    } catch (error) {
      console.error('Failed to fetch auction data:', error)
      addNotification({
        type: 'error',
        message: 'Failed to load auction preview'
      })
    }
  }

  const addNotification = (notification) => {
    const id = Date.now()
    setNotifications(prev => [{ ...notification, id }, ...prev].slice(0, 20))
  }

  const handlePlaceBid = (bidAmount) => {
    if (isPreviewMode) {
      addNotification({
        type: 'info',
        message: 'Bidding is disabled in preview mode. Wait for the auction to start!'
      })
      return
    }
    
    if (socket && auctionState && auctionId) {
      console.log('Placing bid:', bidAmount)
      socket.emit('place-bid', {
        auctionId,
        bidAmount: bidAmount
      })
    }
  }

  const handleBackToList = () => {
    navigate('/auctions')
  }

  if (!auctionState) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0A0A0A, #1a1a1a, #0A0A0A)' }}>
        <div className="animate-spin w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p style={{ color: '#E5E5E5' }}>Loading auction...</p>
      </div>
    )
  }

  return (
    <ModernAuctionRoom
      username={user?.username}
      auctionState={auctionState}
      notifications={notifications}
      participants={participants}
      onPlaceBid={handlePlaceBid}
      onBackToList={handleBackToList}
      isPreviewMode={isPreviewMode}
    />
  )
}

// Auction List Wrapper
function AuctionListWrapper() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])

  const isAdmin = user?.role === 'admin'

  const handleJoinAuction = (auctionId, mode = 'live') => {
    if (mode === 'preview') {
      navigate(`/auction/${auctionId}?mode=preview`)
    } else {
      navigate(`/auction/${auctionId}`)
    }
  }

  const handleShowAdminDashboard = () => {
    navigate('/admin')
  }

  return (
    <ModernAuctionList
      username={user?.username}
      isAdmin={isAdmin}
      onJoinAuction={handleJoinAuction}
      onShowAdminDashboard={handleShowAdminDashboard}
      notifications={notifications}
    />
  )
}

// Admin Dashboard Wrapper
function AdminDashboardWrapper() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])

  const handleBackToAuctions = () => {
    navigate('/auctions')
  }

  return (
    <AdminDashboard
      onBackToAuctions={handleBackToAuctions}
      notifications={notifications}
    />
  )
}

// Landing Page Wrapper
function LandingPageWrapper() {
  const navigate = useNavigate()

  return (
    <LandingPage
      onNavigateToLogin={() => navigate('/login')}
      onNavigateToRegister={() => navigate('/register')}
    />
  )
}

// Login Wrapper
function LoginWrapper() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #0A0A0A, #1a1a1a, #0A0A0A)' }}>
      <ModernLogin
        onSwitchToRegister={() => navigate('/register')}
        onBackToLanding={() => navigate('/')}
      />
    </div>
  )
}

// Register Wrapper
function RegisterWrapper() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #0A0A0A, #1a1a1a, #0A0A0A)' }}>
      <ModernRegister
        onSwitchToLogin={() => navigate('/login')}
        onBackToLanding={() => navigate('/')}
      />
    </div>
  )
}

function AppContent() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0A0A0A, #1a1a1a, #0A0A0A)' }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <AuthRoute>
            <LandingPageWrapper />
          </AuthRoute>
        } />
        
        <Route path="/login" element={
          <AuthRoute>
            <LoginWrapper />
          </AuthRoute>
        } />
        
        <Route path="/register" element={
          <AuthRoute>
            <RegisterWrapper />
          </AuthRoute>
        } />

        {/* Protected Routes */}
        <Route path="/auctions" element={
          <ProtectedRoute>
            <AuctionListWrapper />
          </ProtectedRoute>
        } />
        
        <Route path="/auction/:auctionId" element={
          <ProtectedRoute>
            <AuctionRoomWrapper />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboardWrapper />
          </AdminRoute>
        } />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(39,39,42,0.8))',
            color: '#fff',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3), 0 0 20px rgba(255,215,0,0.1)',
            backdropFilter: 'blur(20px)',
            maxWidth: '400px',
          },
          success: {
            style: {
              border: '1px solid rgba(34, 197, 94, 0.3)',
              background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(22, 163, 74, 0.1))',
            },
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            style: {
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(220, 38, 38, 0.1))',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App