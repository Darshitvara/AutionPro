import { useEffect, useState } from 'react'

function ProductCard({ auctionState }) {
  const [displayTime, setDisplayTime] = useState('')

  useEffect(() => {
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    setDisplayTime(formatTime(auctionState.remainingTime))
  }, [auctionState.remainingTime])

  const isWarning = auctionState.remainingTime <= 10 && auctionState.isActive

  return (
    <div className="product-card">
      {/* Product Header */}
      <div className="product-header">
        <h2>{auctionState.productName}</h2>
        <div className={`status-badge ${auctionState.isActive ? 'active' : 'ended'}`}>
          {auctionState.isActive ? '🟢 Live' : '🔴 Ended'}
        </div>
      </div>

      {/* Timer */}
      <div className="timer-section">
        <span className="timer-label">Time Remaining</span>
        <div className={`timer-value ${isWarning ? 'warning' : ''}`}>
          {displayTime}
        </div>
      </div>

      {/* Price Section */}
      <div className="price-section">
        <div className="price-box">
          <span className="label">Current Bid</span>
          <div className="value">₹{auctionState.currentPrice.toLocaleString('en-IN')}</div>
        </div>
        <div className="price-box">
          <span className="label">Highest Bidder</span>
          <div className="bidder-name">
            {auctionState.highestBidder || 'No bids yet'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
