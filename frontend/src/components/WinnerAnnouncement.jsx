function WinnerAnnouncement({ winner, finalPrice, status, manuallyEnded }) {
  const getEndMessage = () => {
    if (status === 'cancelled') {
      return '🚫 Auction Cancelled'
    }
    if (manuallyEnded) {
      return '⏹️ Auction Stopped by Admin'
    }
    return '🎉 Auction Ended!'
  }

  const getSubMessage = () => {
    if (status === 'cancelled') {
      return 'This auction has been cancelled.'
    }
    if (manuallyEnded) {
      return 'The auction was manually stopped before the timer expired.'
    }
    return 'The 5-minute bidding period has completed.'
  }

  return (
    <div className="winner-card auction-result-card">
      <div className="emoji-icon">{getEndMessage().split(' ')[0]}</div>
      <h2 className="title">{getEndMessage().split(' ').slice(1).join(' ')}</h2>
      <p className="end-reason">{getSubMessage()}</p>
      
      {winner && status !== 'cancelled' ? (
        <div className="winner-details">
          <div className="winner-info">
            <span className="winner-label">🏆 Winner:</span>
            <span className="winner-name">{winner}</span>
          </div>
          <div className="price-info">
            <span className="price-label">💰 Final Bid:</span>
            <span className="price-amount">₹{finalPrice?.toLocaleString('en-IN') || '0'}</span>
          </div>
        </div>
      ) : status !== 'cancelled' ? (
        <div className="no-bids">
          <p>📭 No bids were placed in this auction.</p>
        </div>
      ) : null}
    </div>
  )
}

export default WinnerAnnouncement
