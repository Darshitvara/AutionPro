import { useAuth } from '../context/AuthContext'
import ProductCard from './ProductCard'
import BidForm from './BidForm'
import WinnerAnnouncement from './WinnerAnnouncement'
import Notifications from './Notifications'
import Participants from './Participants'

function AuctionRoom({ username, auctionState, notifications, participants, onPlaceBid, onBackToList }) {
  const { logout } = useAuth()

  const formatTime = (seconds) => {
    if (seconds <= 0) return '00:00'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (!auctionState) {
    return (
      <div className="auction-container">
        <div style={{ textAlign: 'center', color: 'white', fontSize: '1.5rem' }}>
          Loading auction...
        </div>
      </div>
    )
  }

  return (
    <div className="auction-container">
      {/* Header */}
      <div className="auction-header">
        <div className="header-left">
          <button onClick={onBackToList} className="btn-back">
            ← Back to Auctions
          </button>
          <h1>🔨 {auctionState.product?.name || 'Auction Room'}</h1>
        </div>
        <div className="user-info">
          <div className="user-badge">
            👤 {username}
          </div>
          <div className="participants-badge">
            👥 {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
          </div>
          <button onClick={logout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="auction-main">
        {/* Left Column */}
        <div>
          <ProductCard auctionState={auctionState} />
          
          {/* Auction State Conditional Rendering */}
          {auctionState.status === 'scheduled' ? (
            <div className="auction-status-card">
              <h3 className="status-title">🕐 Auction Scheduled</h3>
              <p className="status-message">
                This auction is scheduled to start at{' '}
                <strong>{new Date(auctionState.scheduledStartTime).toLocaleString()}</strong>
              </p>
              <div className="countdown-timer">
                <div className="timer-display">
                  {auctionState.remainingTime > 0 ? (
                    <>
                      <span className="timer-label">Starts in:</span>
                      <span className="timer-value">{formatTime(auctionState.remainingTime)}</span>
                    </>
                  ) : (
                    <span className="timer-label">Starting soon...</span>
                  )}
                </div>
              </div>
              <p className="status-note">
                Bidding will be available once the auction starts.
              </p>
            </div>
          ) : auctionState.status === 'active' ? (
            <BidForm
              currentPrice={auctionState.currentPrice}
              onPlaceBid={onPlaceBid}
            />
          ) : (
            <WinnerAnnouncement
              winner={auctionState.winner || auctionState.highestBidder}
              finalPrice={auctionState.finalPrice || auctionState.currentPrice}
              status={auctionState.status}
              manuallyEnded={auctionState.manuallyEnded}
            />
          )}
        </div>

        {/* Right Column */}
        <div className="sidebar">
          <Notifications notifications={notifications} />
          <Participants participants={participants} currentUsername={username} />
        </div>
      </div>
    </div>
  )
}

export default AuctionRoom
