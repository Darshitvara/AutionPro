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

const SOCKET_URL = 'http://localhost:5000'

function AppContent() {
  const { isAuthenticated, user, token, loading } = useAuth()
  const [showRegister, setShowRegister] = useState(false)
  const [showAuth, setShowAuth] = useState(false) // New state for auth screens
  const [socket, setSocket] = useState(null)
  const [auctionState, setAuctionState] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [participants, setParticipants] = useState([])
  const [currentView, setCurrentView] = useState('auction-list') // 'auction-list', 'auction-room', 'admin-dashboard'
  const [selectedAuctionId, setSelectedAuctionId] = useState(null)

  useEffect(() => {
    if (isAuthenticated && user && token && selectedAuctionId) {
      // Connect to Socket.IO server with authentication for specific auction
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: token
        },
        transports: ['websocket'],
      })

      newSocket.on('connect', () => {
        console.log('Connected to server with auth')
        console.log('Joining auction with ID:', selectedAuctionId)
        // Join the specific auction room
        newSocket.emit('join-auction', { auctionId: selectedAuctionId })
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message)
        addNotification({
          type: 'error',
          message: 'Failed to connect to server'
        })
      })

      newSocket.on('auction-state', (state) => {
        console.log('Received auction state:', state)
        setAuctionState(state)
        setParticipants(state.participants || [])
      })

      newSocket.on('user-joined', (data) => {
        console.log('User joined:', data)
        setParticipants(data.participants || [])
        addNotification({
          type: 'info',
          message: `${data.username} joined the auction`
        })
      })

      newSocket.on('user-left', (data) => {
        console.log('User left:', data)
        setParticipants(data.participants || [])
        addNotification({
          type: 'info',
          message: `${data.username} left the auction`
        })
      })

      newSocket.on('bid-placed', (data) => {
        console.log('Bid placed:', data)
        setAuctionState(prev => ({
          ...prev,
          currentPrice: data.currentPrice,
          highestBidder: data.highestBidder
        }))
        
        if (data.bidder !== user.username) {
          addNotification({
            type: 'info',
            message: `${data.bidder} placed a bid of $${data.currentPrice}`
          })
        }
      })

      newSocket.on('timer-update', (data) => {
        setAuctionState(prev => ({
          ...prev,
          remainingTime: data.remainingTime,
          isActive: data.isActive
        }))
      })

      newSocket.on('auction-ended', (data) => {
        console.log('Auction ended:', data)
        setAuctionState(prev => ({
          ...prev,
          isActive: false,
          winner: data.winner,
          finalPrice: data.finalPrice
        }))
        
        addNotification({
          type: 'success',
          message: `Auction ended! Winner: ${data.winner} with $${data.finalPrice}`
        })
      })

      newSocket.on('bid-rejected', (data) => {
        console.log('Bid rejected:', data)
        addNotification({
          type: 'error',
          message: data.message
        })
      })

      newSocket.on('notification', (notification) => {
        addNotification(notification)
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
  }, [isAuthenticated, user, token, selectedAuctionId])

  const addNotification = (notification) => {
    const id = Date.now()
    setNotifications(prev => [{ ...notification, id }, ...prev].slice(0, 20))
  }

  const handlePlaceBid = (bidAmount) => {
    if (socket && auctionState && selectedAuctionId) {
      console.log('Placing bid:', bidAmount)
      socket.emit('place-bid', {
        auctionId: selectedAuctionId,
        bidAmount: bidAmount
      })
    }
  }

  const handleJoinAuction = (auctionId) => {
    console.log('handleJoinAuction called with:', auctionId)
    setSelectedAuctionId(auctionId)
    setCurrentView('auction-room')
    setAuctionState(null) // Reset state for new auction
    setParticipants([])
  }

  const handleBackToList = () => {
    console.log('Going back to auction list')
    setCurrentView('auction-list')
    setSelectedAuctionId(null)
    setAuctionState(null)
    setParticipants([])
    if (socket) {
      socket.disconnect()
    }
  }

  const handleShowAdminDashboard = () => {
    setCurrentView('admin-dashboard')
    if (socket) {
      socket.disconnect()
    }
  }

  const handleBackFromAdmin = () => {
    setCurrentView('auction-list')
  }

  const isAdmin = user?.role === 'admin'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="glass rounded-3xl p-8 text-center">
          <div className="animate-spin w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
          <p className="text-gray-400">Initializing auction system</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {!isAuthenticated ? (
        <>
          {!showAuth ? (
            <LandingPage 
              onNavigateToLogin={() => {
                setShowAuth(true)
                setShowRegister(false)
              }}
              onNavigateToRegister={() => {
                setShowAuth(true)
                setShowRegister(true)
              }}
            />
          ) : (
            <div className="min-h-screen flex items-center justify-center p-6">
              {showRegister ? (
                <ModernRegister 
                  onSwitchToLogin={() => setShowRegister(false)}
                  onBackToLanding={() => setShowAuth(false)}
                />
              ) : (
                <ModernLogin 
                  onSwitchToRegister={() => setShowRegister(true)}
                  onBackToLanding={() => setShowAuth(false)}
                />
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {currentView === 'auction-list' && (
            <ModernAuctionList
              username={user.username}
              isAdmin={isAdmin}
              onJoinAuction={handleJoinAuction}
              onShowAdminDashboard={handleShowAdminDashboard}
              notifications={notifications}
            />
          )}
          
          {currentView === 'auction-room' && (
            <ModernAuctionRoom
              username={user.username}
              auctionState={auctionState}
              notifications={notifications}
              participants={participants}
              onPlaceBid={handlePlaceBid}
              onBackToList={handleBackToList}
            />
          )}
          
          {currentView === 'admin-dashboard' && isAdmin && (
            <AdminDashboard
              username={user.username}
              onBackToList={handleBackFromAdmin}
              notifications={notifications}
            />
          )}
        </>
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#ffffff',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: '16px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <AppContent />
    </AuthProvider>
  )
}

export default App