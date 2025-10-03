import { useState, useEffect } from 'react';
import { auctionAPI } from '../services/api';
import toast from 'react-hot-toast';

function AdminDashboard({ onBackToAuctions }) {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    startingPrice: '',
    durationMinutes: '5'
  });

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const response = await auctionAPI.getAll();
      if (response.success) {
        setAuctions(response.auctions);
      }
    } catch (error) {
      console.error('Fetch auctions error:', error);
    }
  };

  const handleCreateAuction = async (e) => {
    e.preventDefault();
    
    if (!formData.productName.trim() || !formData.startingPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseInt(formData.startingPrice) < 1) {
      toast.error('Starting price must be at least ₹1');
      return;
    }

    try {
      setLoading(true);
      const response = await auctionAPI.create({
        productName: formData.productName.trim(),
        startingPrice: parseInt(formData.startingPrice),
        durationMinutes: parseInt(formData.durationMinutes)
      });

      if (response.success) {
        toast.success('Auction created successfully!');
        setFormData({ productName: '', startingPrice: '', durationMinutes: '5' });
        setShowCreateForm(false);
        fetchAuctions();
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create auction';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAuction = async (auctionId, productName) => {
    if (!confirm(`Are you sure you want to delete the auction for "${productName}"?`)) {
      return;
    }

    try {
      const response = await auctionAPI.delete(auctionId);
      if (response.success) {
        toast.success('Auction deleted successfully');
        fetchAuctions();
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete auction';
      toast.error(message);
    }
  };

  const formatTime = (seconds) => {
    if (seconds <= 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-title">
          <h1>🛠️ Admin Dashboard</h1>
          <p>Manage auction items and monitor activity</p>
        </div>
        <div className="admin-actions">
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary"
          >
            {showCreateForm ? '❌ Cancel' : '➕ Create Auction'}
          </button>
          <button onClick={onBackToAuctions} className="btn-secondary">
            👀 View Auctions
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="create-auction-form">
          <h3>Create New Auction</h3>
          <form onSubmit={handleCreateAuction}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., iPhone 15 Pro Max"
                  value={formData.productName}
                  onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Starting Price (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="10000"
                  min="1"
                  value={formData.startingPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, startingPrice: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <select
                  className="form-input"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationMinutes: e.target.value }))}
                >
                  <option value="2">2 minutes</option>
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : '🚀 Create Auction'}
            </button>
          </form>
        </div>
      )}

      <div className="auctions-management">
        <h3>Existing Auctions ({auctions.length})</h3>
        
        {auctions.length === 0 ? (
          <div className="empty-state">
            <p>No auctions created yet. Create your first auction above!</p>
          </div>
        ) : (
          <div className="auctions-table">
            <div className="table-header">
              <span>Product</span>
              <span>Status</span>
              <span>Current Price</span>
              <span>Time Left</span>
              <span>Participants</span>
              <span>Actions</span>
            </div>
            
            {auctions.map((auction) => (
              <div key={auction.id} className="table-row">
                <span className="product-name">{auction.productName}</span>
                <span className={`status ${auction.isActive && auction.remainingTime > 0 ? 'active' : 'ended'}`}>
                  {auction.isActive && auction.remainingTime > 0 ? '🟢 Live' : '🔴 Ended'}
                </span>
                <span className="price">₹{auction.currentPrice.toLocaleString('en-IN')}</span>
                <span className="time">{formatTime(auction.remainingTime)}</span>
                <span className="participants">{auction.participantCount || 0}</span>
                <span className="actions">
                  <button 
                    onClick={() => handleDeleteAuction(auction.id, auction.productName)}
                    className="btn-danger btn-small"
                    title="Delete Auction"
                  >
                    🗑️
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;