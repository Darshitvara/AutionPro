import { useState, useEffect } from 'react';
import { auctionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function AuctionList({ username, isAdmin, onJoinAuction, onShowAdminDashboard, notifications }) {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = useAuth();

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const response = await auctionAPI.getAll();
      if (response.success) {
        setAuctions(response.auctions);
      }
    } catch (error) {
      setError('Failed to load auctions');
      console.error('Fetch auctions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds <= 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (auction) => {
    switch (auction.status) {
      case 'upcoming':
        return <span className="status-badge upcoming">Upcoming</span>;
      case 'live':
        if (auction.remainingTime <= 60) {
          return <span className="status-badge ending">Ending Soon</span>;
        }
        return <span className="status-badge live">Live</span>;
      case 'closed':
        return <span className="status-badge closed">Closed</span>;
      case 'cancelled':
        return <span className="status-badge cancelled">Cancelled</span>;
      default:
        return <span className="status-badge">Unknown</span>;
    }
  };

  if (loading) {
    return (
      <div className="auction-list-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading auctions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auction-list-container">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchAuctions} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-list-container">
      {/* Header */}
      <div className="auction-header">
        <div className="header-left">
          <h1>🏛️ Live Auctions</h1>
          <p>Choose an auction to join and start bidding</p>
        </div>
        <div className="user-info">
          <div className="user-badge">
            👤 {username}
          </div>
          {isAdmin && (
            <button onClick={onShowAdminDashboard} className="btn-secondary">
              ⚙️ Admin Dashboard
            </button>
          )}
          <button onClick={fetchAuctions} className="btn-secondary">
            🔄 Refresh
          </button>
          <button onClick={logout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      {auctions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No Auctions Available</h3>
          <p>Check back later for new auctions!</p>
          {isAdmin && (
            <button onClick={onShowAdminDashboard} className="btn-primary">
              Create New Auction
            </button>
          )}
        </div>
      ) : (
        <div className="auctions-grid">
          {auctions.map((auction) => (
            <div key={auction.id} className="auction-card">
              <div className="auction-card-header">
                <h3>{auction.productName}</h3>
                {getStatusBadge(auction)}
              </div>
              
              <div className="auction-card-content">
                <div className="price-info">
                  <div className="current-price">
                    <span className="label">Current Bid</span>
                    <span className="amount">₹{auction.currentPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="starting-price">
                    <span className="label">Starting Price</span>
                    <span className="amount">₹{auction.startingPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="auction-meta">
                  <div className="timer">
                    <span className="timer-icon">⏰</span>
                    <span className="time">{formatTime(auction.remainingTime)}</span>
                  </div>
                  <div className="participants">
                    <span className="participants-icon">👥</span>
                    <span className="count">{auction.participantCount || 0} participants</span>
                  </div>
                </div>

                {auction.highestBidder && (
                  <div className="highest-bidder">
                    <span className="crown">👑</span>
                    <span>Leading: {auction.highestBidder}</span>
                  </div>
                )}
              </div>

              <div className="auction-card-footer">
                {auction.status === 'live' && auction.remainingTime > 0 ? (
                  <button 
                    onClick={() => onJoinAuction(auction.id)}
                    className="btn-primary join-btn"
                  >
                    🔨 Join Auction
                  </button>
                ) : auction.status === 'upcoming' ? (
                  <button 
                    onClick={() => onJoinAuction(auction.id, 'preview')}
                    className="btn-secondary join-btn"
                  >
                    👁️ Preview Room
                  </button>
                ) : (
                  <button className="btn-disabled" disabled>
                    Auction {auction.status === 'closed' ? 'Closed' : 'Ended'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AuctionList;