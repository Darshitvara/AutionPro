import { useAuth } from '../context/AuthContext'
import ProductCard from './ProductCard'
import BidForm from './BidForm'
import WinnerAnnouncement from './WinnerAnnouncement'
import Notifications from './Notifications'
import Participants from './Participants'

function AuctionRoom({ username, auctionState, notifications, participants, onPlaceBid, onBackToList }) {
  const { logout } = useAuth()

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
          
          {auctionState.isActive ? (
            <BidForm
              currentPrice={auctionState.currentPrice}
              onPlaceBid={onPlaceBid}
            />
          ) : (
            <WinnerAnnouncement
              winner={auctionState.winner || auctionState.highestBidder}
              finalPrice={auctionState.finalPrice || auctionState.currentPrice}
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
