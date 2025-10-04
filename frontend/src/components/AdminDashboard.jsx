import { useState, useEffect } from 'react';
import { auctionAPI } from '../services/api';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function AdminDashboard({ onBackToAuctions }) {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    productImage: '',
    productCategory: 'General',
    startingPrice: '',
    scheduledStartTime: '',
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
    
    if (!formData.productName.trim() || !formData.startingPrice || !formData.scheduledStartTime) {
      toast.error('Please fill in all required fields including scheduled start time');
      return;
    }

    if (parseInt(formData.startingPrice) < 1) {
      toast.error('Starting price must be at least ₹1');
      return;
    }

    // Validate that start time is in the future (with at least 1 minute buffer)
    const startTime = new Date(formData.scheduledStartTime);
    const now = new Date();
    const minTime = new Date(now.getTime() + 60000); // 1 minute from now
    if (startTime <= minTime) {
      toast.error('Scheduled start time must be at least 1 minute in the future');
      return;
    }

    try {
      setLoading(true);
      const response = await auctionAPI.create({
        productName: formData.productName.trim(),
        product: {
          name: formData.productName.trim(),
          description: formData.productDescription.trim() || 'Premium auction item with excellent quality.',
          image: formData.productImage.trim() || 'https://via.placeholder.com/400x300?text=Auction+Item',
          category: formData.productCategory
        },
        startingPrice: parseInt(formData.startingPrice),
        scheduledStartTime: startTime.toISOString(),
        durationMinutes: parseInt(formData.durationMinutes)
      });

      if (response.success) {
        toast.success('Auction scheduled successfully!');
        setFormData({ 
          productName: '', 
          productDescription: '', 
          productImage: '', 
          productCategory: 'General', 
          startingPrice: '', 
          scheduledStartTime: '',
          durationMinutes: '5' 
        });
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

  const handleStartAuction = async (auctionId) => {
    if (!confirm('Are you sure you want to start this auction now?')) {
      return;
    }

    try {
      const response = await auctionAPI.start(auctionId);
      if (response.success) {
        toast.success('Auction started successfully');
        fetchAuctions();
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to start auction';
      toast.error(message);
    }
  };

  const handleStopAuction = async (auctionId) => {
    if (!confirm('Are you sure you want to stop this auction? This will finalize the current highest bidder as the winner.')) {
      return;
    }

    try {
      const response = await auctionAPI.stop(auctionId);
      if (response.success) {
        toast.success('Auction stopped successfully');
        fetchAuctions();
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to stop auction';
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
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0A0A0A, #1a1a1a, #0A0A0A)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 p-6 rounded-xl backdrop-blur-md bg-black/30 border border-yellow-500/20">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-2">
              🛠️ Admin Dashboard
            </h1>
            <p className="text-gray-300">Manage auction items and monitor activity</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-300 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-300 hover:to-yellow-500 transform hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/25"
            >
              {showCreateForm ? '❌ Cancel' : '➕ Create Auction'}
            </button>
            <button 
              onClick={onBackToAuctions} 
              className="px-6 py-3 rounded-lg font-medium transition-all duration-300 bg-gray-800/50 text-gray-300 border border-gray-600 hover:bg-gray-700/50 hover:text-white hover:border-gray-500"
            >
              👀 View Auctions
            </button>
          </div>
        </div>

        {/* Create Auction Form */}
        {showCreateForm && (
          <div className="mb-8 p-6 rounded-xl backdrop-blur-md bg-black/40 border border-yellow-500/20">
            <h3 className="text-xl font-bold text-yellow-400 mb-6">Create New Auction</h3>
            <form onSubmit={handleCreateAuction} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Product Name *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-black/50 border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300"
                    placeholder="e.g., iPhone 15 Pro Max"
                    value={formData.productName}
                    onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Category</label>
                  <select
                    className="w-full px-4 py-3 rounded-lg bg-black/50 border border-gray-600 text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300"
                    value={formData.productCategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, productCategory: e.target.value }))}
                  >
                    <option value="General">General</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Home & Garden">Home & Garden</option>
                    <option value="Sports">Sports</option>
                    <option value="Collectibles">Collectibles</option>
                    <option value="Art">Art</option>
                    <option value="Jewelry">Jewelry</option>
                    <option value="Vehicles">Vehicles</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">Product Description</label>
                <textarea
                  className="w-full px-4 py-3 rounded-lg bg-black/50 border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300"
                  placeholder="Detailed description of the auction item..."
                  value={formData.productDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, productDescription: e.target.value }))}
                  rows="3"
                  maxLength="500"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">Product Image URL</label>
                <input
                  type="url"
                  className="w-full px-4 py-3 rounded-lg bg-black/50 border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300"
                  placeholder="https://example.com/image.jpg"
                  value={formData.productImage}
                  onChange={(e) => setFormData(prev => ({ ...prev, productImage: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">Scheduled Start Time *</label>
                <DatePicker
                  selected={formData.scheduledStartTime ? new Date(formData.scheduledStartTime) : null}
                  onChange={(date) => setFormData(prev => ({ ...prev, scheduledStartTime: date ? date.toISOString().slice(0, 16) : '' }))}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  minDate={new Date(Date.now() + 60000)} // Minimum 1 minute from now
                  placeholderText="Select the start time for bidding"
                  className="w-full px-4 py-3 rounded-lg bg-black/50 border border-gray-600 text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300"
                  wrapperClassName="w-full"
                  popperClassName="react-datepicker-custom"
                  required
                />
                <p className="text-xs text-gray-400 mt-2">
                  📅 Select when the auction bidding should start (must be in the future)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Starting Price (₹) *</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-lg bg-black/50 border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300"
                    placeholder="10000"
                    min="1"
                    value={formData.startingPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, startingPrice: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Duration (minutes)</label>
                  <select
                    className="w-full px-4 py-3 rounded-lg bg-black/50 border border-gray-600 text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300"
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

              <button 
                type="submit" 
                className="w-full px-6 py-3 rounded-lg font-medium transition-all duration-300 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-300 hover:to-yellow-500 transform hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={loading}
              >
                {loading ? 'Creating...' : '🚀 Create Auction'}
              </button>
            </form>
          </div>
        )}

        {/* Auctions Management */}
        <div className="p-6 rounded-xl backdrop-blur-md bg-black/40 border border-yellow-500/20">
          <h3 className="text-xl font-bold text-yellow-400 mb-6">
            Existing Auctions ({auctions.length})
          </h3>
          
          {auctions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-400 text-lg">No auctions created yet. Create your first auction above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 p-4 bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 rounded-t-lg border-b border-yellow-500/20">
                  <span className="font-medium text-yellow-400">Product</span>
                  <span className="font-medium text-yellow-400">Status</span>
                  <span className="font-medium text-yellow-400">Current Price</span>
                  <span className="font-medium text-yellow-400">Time Left</span>
                  <span className="font-medium text-yellow-400">Participants</span>
                  <span className="font-medium text-yellow-400">Actions</span>
                </div>
                
                {/* Table Rows */}
                {auctions.map((auction, index) => (
                  <div 
                    key={auction.id} 
                    className={`grid grid-cols-6 gap-4 p-4 border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors duration-300 ${
                      index === auctions.length - 1 ? 'rounded-b-lg' : ''
                    }`}
                  >
                    <span className="text-gray-300 font-medium truncate">{auction.productName}</span>
                    <span className="flex items-center">
                      {auction.status === 'scheduled' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-400 border border-blue-500/20">
                          ⏰ Scheduled
                        </span>
                      ) : auction.status === 'active' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-400 border border-green-500/20">
                          🟢 Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-400 border border-red-500/20">
                          🔴 Ended
                        </span>
                      )}
                    </span>
                    <span className="text-yellow-400 font-semibold">₹{auction.currentPrice.toLocaleString('en-IN')}</span>
                    <span className="text-gray-300 font-mono">{formatTime(auction.remainingTime)}</span>
                    <span className="text-gray-300">{auction.participantCount || 0}</span>
                    <span className="flex items-center gap-2">
                      {auction.status === 'scheduled' && (
                        <button 
                          onClick={() => handleStartAuction(auction.id)}
                          className="px-3 py-1 rounded-lg text-green-400 hover:text-green-300 hover:bg-green-900/20 transition-all duration-300 border border-green-500/20 hover:border-green-400/40"
                          title="Start Auction Now"
                        >
                          ▶️
                        </button>
                      )}
                      {auction.status === 'active' && (
                        <button 
                          onClick={() => handleStopAuction(auction.id)}
                          className="px-3 py-1 rounded-lg text-orange-400 hover:text-orange-300 hover:bg-orange-900/20 transition-all duration-300 border border-orange-500/20 hover:border-orange-400/40"
                          title="Stop Auction"
                        >
                          ⏹️
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteAuction(auction.id, auction.productName)}
                        className="px-3 py-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all duration-300 border border-red-500/20 hover:border-red-400/40"
                        title="Delete Auction"
                      >
                        🗑️
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;