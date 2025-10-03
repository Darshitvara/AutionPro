import { useState } from 'react'

function BidForm({ currentPrice, onPlaceBid }) {
  const [bidAmount, setBidAmount] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const amount = parseInt(bidAmount)
    if (isNaN(amount) || amount <= currentPrice) {
      return
    }

    onPlaceBid(amount)
    setBidAmount('')
  }

  const minBid = currentPrice + 100

  return (
    <div className="bid-form-card">
      <h3>Place Your Bid</h3>
      
      <form onSubmit={handleSubmit} className="bid-form">
        <div className="bid-input-group">
          <span className="currency-symbol">₹</span>
          <input
            type="number"
            className="bid-input"
            placeholder="Enter bid amount"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            min={minBid}
            step="100"
            required
          />
        </div>
        
        <button type="submit" className="btn-primary">
          Place Bid
        </button>
      </form>
      
      <p className="bid-hint">
        Minimum bid: ₹{minBid.toLocaleString('en-IN')}
      </p>
    </div>
  )
}

export default BidForm
