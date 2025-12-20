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
  const [bidPending, setBidPending] = useState(false)
  const [bidError, setBidError] = useState(null)
  // No optimistic UI: we only update after server confirms
  
  // Check if we're in preview or history mode
  const urlParams = new URLSearchParams(window.location.search)
  const isPreviewMode = urlParams.get('mode') === 'preview'
  const isHistoryMode = urlParams.get('mode') === 'history'

  useEffect(() => {
    if (token && auctionId) {
      if (isPreviewMode || isHistoryMode) {
        // In preview/history mode, just fetch auction data without connecting to socket
        fetchAuctionData()
      } else {
        // Regular live auction mode with socket connection
        const baseUrl = SOCKET_URL || window.location.origin
        const newSocket = io(baseUrl, {
          auth: { token },
          // Allow polling fallback to reduce premature close errors in some hosts/proxies
          transports: ['websocket', 'polling'],
          path: '/socket.io',
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
        })

        newSocket.on('connect', () => {
          newSocket.emit('join-auction', { auctionId })
        })

        newSocket.on('connect_error', (err) => {
          console.error('Socket connect_error:', err?.message || err)
        })

        newSocket.on('auction-state', (state) => {
          setAuctionState(state)
          // Any fresh state from server should end pending state
          setBidPending(false)
          if (Array.isArray(state.participants)) {
            setParticipants(state.participants)
          }
        })

        // Participant joins/leaves
        newSocket.on('user-joined', (payload) => {
          if (Array.isArray(payload.participants)) {
            setParticipants(payload.participants)
          }
        })

        newSocket.on('user-left', (payload) => {
          if (Array.isArray(payload.participants)) {
            setParticipants(payload.participants)
          }
        })

        newSocket.on('notification', (notification) => {
          addNotification(notification)
        })

        // Live bid updates
        newSocket.on('bid-placed', (data) => {
          setBidPending(false)
          setBidError(null)
          // Server will broadcast authoritative 'auction-state' after saving.
          addNotification({
            type: 'success',
            message: `${data.username} bid ₹${(data.bidAmount ?? data.currentPrice).toLocaleString()}`
          })
        })

        // Bid rejected
        newSocket.on('bid-rejected', (data) => {
          console.warn('Bid rejected:', data)
          setBidPending(false)
          setBidError(data?.message || 'Bid rejected')
          addNotification({
            type: 'error',
            message: data?.message || 'Bid rejected'
          })
        })

        // Timer updates (server sends milliseconds)
        newSocket.on('timer-update', (data) => {
          setAuctionState(prev => prev ? {
            ...prev,
            remainingTime: Math.max(0, Math.floor((data.remainingTime || 0) / 1000)),
            isActive: data.isActive ?? prev.isActive
          } : prev)
        })

        // Auction ended
        newSocket.on('auction-ended', (data) => {
          setAuctionState(prev => prev ? {
            ...prev,
            status: 'closed',
            isActive: false,
            remainingTime: 0,
            winnerUsername: data.winner ?? prev.winnerUsername,
            winnerId: data.winnerId ?? prev.winnerId,
            finalPrice: data.finalPrice ?? prev.finalPrice,
            highestBidder: data.winner ?? prev.highestBidder
          } : prev)
          addNotification({
            type: 'info',
            message: data.message || 'Auction has ended!'
          })
        })

        const handleSocketError = (data) => {
          if (import.meta.env.DEV) {
            console.error('Socket error:', data?.message, data?.where ? `at ${data.where}` : '', data?.details ? `details: ${data.details}` : '')
          }
          // Always end pending on socket errors and request a fresh state
          setBidPending(false)
          setBidError(data?.message || 'Something went wrong, please try again')
          try {
            newSocket.emit('request-state', { auctionId })
          } catch {}
          addNotification({
            type: 'error',
            message: data?.message || 'Socket error'
          })
        }

  // Listen only to our custom server-side error channel to avoid noisy generic errors
  // Note: Socket.IO reserves some error events; using 'socket-error' keeps semantics clear
  newSocket.on('socket-error', handleSocketError)

        setSocket(newSocket)

        return () => {
          try {
            // Avoid noisy errors: only disconnect if actually connected
            if (newSocket && newSocket.connected) {
              newSocket.disconnect()
            } else if (newSocket) {
              // If still connecting, just remove listeners; let it be GC'd
              newSocket.removeAllListeners()
            }
          } catch (e) {
            // Swallow disconnect errors
          }
        }
      }
    }
  }, [token, auctionId, isPreviewMode, isHistoryMode])


  // Function to fetch auction data for preview mode
  const fetchAuctionData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auctions/${auctionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      if (data.success) {
        if (isHistoryMode) {
          // For history mode, show the actual final state
          setAuctionState(data.auction)
        } else {
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
        }
        setParticipants([]) // No live participants in preview/history
      }
    } catch (error) {
      console.error('Failed to fetch auction data:', error)
      addNotification({
        type: 'error',
        message: `Failed to load auction ${isHistoryMode ? 'history' : 'preview'}`
      })
    }
  }

  const addNotification = (notification) => {
    const id = Date.now()
    setNotifications(prev => [{ ...notification, id }, ...prev].slice(0, 20))
  }

  const handlePlaceBid = (bidAmount) => {
    if (isPreviewMode || isHistoryMode) {
      addNotification({
        type: 'info',
        message: isHistoryMode 
          ? 'This auction has ended. Bidding is not available in history mode.'
          : 'Bidding is disabled in preview mode. Wait for the auction to start!'
      })
      return
    }
    
    if (socket && auctionState && auctionId) {
      setBidPending(true)
      setBidError(null)
      socket.emit('place-bid', {
        auctionId,
        bidAmount: bidAmount
      })
      // We will update UI only after server emits bid-placed (then we request full state) or bid-rejected
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
      isHistoryMode={isHistoryMode}
      bidPending={bidPending}
      bidError={bidError}
      onClearBidError={() => setBidError(null)}
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
    } else if (mode === 'history') {
      navigate(`/auction/${auctionId}?mode=history`)
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