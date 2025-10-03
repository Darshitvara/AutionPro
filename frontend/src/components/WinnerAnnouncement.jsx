function WinnerAnnouncement({ winner, finalPrice }) {
  return (
    <div className="winner-card">
      <h2>🎉 Auction Ended!</h2>
      {winner ? (
        <p>
          <strong>Winner: {winner}</strong>
          <br />
          Final Bid: ₹{finalPrice.toLocaleString('en-IN')}
        </p>
      ) : (
        <p>No bids were placed in this auction.</p>
      )}
    </div>
  )
}

export default WinnerAnnouncement
