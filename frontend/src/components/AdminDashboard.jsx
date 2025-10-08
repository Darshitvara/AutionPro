import { useState, useEffect } from 'react';
import { auctionAPI } from '../services/api';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function AdminDashboard({ onBackToAuctions }) {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [startingAuctions, setStartingAuctions] = useState(new Set()); // Track auctions being started
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

  // Update current time every minute to check auction start times
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timeInterval);
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
      toast.error('Please fill in all required fields including scheduled start date');
      return;
    }

    if (parseInt(formData.startingPrice) < 1) {
      toast.error('Starting price must be at least ₹1');
      return;
    }

    // Validate that start date is in the future (at least tomorrow)
    const startDate = new Date(formData.scheduledStartTime);
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    if (isNaN(startDate.getTime())) {
      toast.error('Please select a valid date');
      return;
    }
    
    if (startDate < tomorrow) {
      toast.error('Scheduled start date must be tomorrow or later');
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
        scheduledStartTime: startDate.toISOString(),
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

    // Add to starting set to show loading state
    setStartingAuctions(prev => new Set(prev).add(auctionId));

    try {
      const response = await auctionAPI.start(auctionId);
      if (response.success) {
        toast.success('Auction started successfully! The auction is now live.');
        
        // Optimistically update the auction status in the UI
        setAuctions(prevAuctions => 
          prevAuctions.map(auction => 
            auction.id === auctionId 
              ? { ...auction, status: 'live' }
              : auction
          )
        );
        
        // Fetch latest data to ensure consistency
        setTimeout(() => {
          fetchAuctions();
        }, 1000);
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to start auction';
      toast.error(message);
    } finally {
      // Remove from starting set
      setStartingAuctions(prev => {
        const newSet = new Set(prev);
        newSet.delete(auctionId);
        return newSet;
      });
    }
  };

  const handleStopAuction = async (auctionId) => {
    if (!confirm('Are you sure you want to stop this auction? This will finalize the current highest bidder as the winner.')) {
      return;
    }

    try {
      const response = await auctionAPI.stop(auctionId);
      if (response.success) {
        toast.success('Auction stopped successfully! The auction has ended.');
        
        // Optimistically update the auction status in the UI
        setAuctions(prevAuctions => 
          prevAuctions.map(auction => 
            auction.id === auctionId 
              ? { ...auction, status: 'closed' }
              : auction
          )
        );
        
        // Fetch latest data to ensure consistency
        setTimeout(() => {
          fetchAuctions();
        }, 1000);
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

  // Check if auction can be started based on scheduled time
  const canStartAuction = (auction) => {
    if (!auction.scheduledStartTime) return false;
    const scheduledTime = new Date(auction.scheduledStartTime);
    return currentTime >= scheduledTime;
  };

  // Get the actual status of auction based on scheduled time and backend status
  const getActualAuctionStatus = (auction) => {
    // Handle backend status values (upcoming, live, closed) and convert to frontend display values
    
    // If backend says it's live/active, show as active
    if (auction.status === 'live' || auction.status === 'active') return 'active';
    
    // If backend says it's closed/ended, show as ended
    if (auction.status === 'closed' || auction.status === 'ended') return 'ended';
    
    // If auction has a scheduled start time in the future, it should be 'scheduled'
    if (auction.scheduledStartTime) {
      const scheduledTime = new Date(auction.scheduledStartTime);
      if (currentTime < scheduledTime) {
        return 'scheduled';
      }
      // If scheduled time has passed but not started, still show as scheduled (waiting for manual start)
      if (auction.status !== 'live' && auction.status !== 'active' && auction.status !== 'closed' && auction.status !== 'ended') {
        return 'scheduled';
      }
    }
    
    // For 'upcoming' status or any other case, determine based on scheduled time
    if (auction.status === 'upcoming' || auction.status === 'scheduled') {
      return 'scheduled';
    }
    
    // Otherwise, use the backend status or default to ended if unknown
    return auction.status === 'live' ? 'active' : 'ended';
  };

  // Get time remaining until auction can be started
  const getTimeUntilStart = (auction) => {
    if (!auction.scheduledStartTime) return null;
    const scheduledTime = new Date(auction.scheduledStartTime);
    const timeDiff = scheduledTime - currentTime;
    
    if (timeDiff <= 0) return null;
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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
                <label className="block text-gray-300 font-medium mb-2">Scheduled Start Date *</label>
                <DatePicker
                  selected={formData.scheduledStartTime ? new Date(formData.scheduledStartTime) : null}
                  onChange={(date) => setFormData(prev => ({ 
                    ...prev, 
                    scheduledStartTime: date ? date.toISOString() : '' 
                  }))}
                  dateFormat="MMM d, yyyy"
                  minDate={new Date(Date.now() + 24 * 60 * 60 * 1000)} // Minimum 1 day from now
                  maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)} // Max 3 months ahead
                  placeholderText="Select date"
                  className="w-full px-3 py-2.5 rounded-lg bg-black/50 border border-gray-600 text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300 text-sm"
                  wrapperClassName="w-full relative"
                  popperClassName="react-datepicker-compact"
                  popperPlacement="bottom-start"
                  popperModifiers={[
                    {
                      name: "offset",
                      options: {
                        offset: [0, 8]
                      }
                    },
                    {
                      name: "preventOverflow",
                      options: {
                        boundary: "clippingParents",
                        altBoundary: false,
                        padding: 8
                      }
                    }
                  ]}
                  shouldCloseOnSelect={true}
                  showYearDropdown={false}
                  showMonthDropdown={false}
                  showPopperArrow={false}
                  calendarStartDay={1}
                  inline={false}
                  required
                />
                <p className="text-xs text-gray-400 mt-2">
                  📅 Select the date when you want the auction to start
                </p>
                <div className="text-xs text-yellow-400 mt-1">
                  💡 Simple date selection: Choose any day starting tomorrow
                </div>
                {formData.scheduledStartTime && (
                  <div className="mt-3 p-3 rounded-lg bg-green-900/30 border border-green-500/30">
                    <div className="text-sm text-green-400 font-medium">
                      ✅ Selected: {new Date(formData.scheduledStartTime).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-green-300 mt-1">
                      Auction scheduled for: {new Date(formData.scheduledStartTime).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                )}
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
                    <span className="flex flex-col">
                      {(() => {
                        const actualStatus = getActualAuctionStatus(auction);
                        if (actualStatus === 'scheduled') {
                          return (
                            <>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-400 border border-blue-500/20 mb-1">
                                ⏰ Scheduled
                              </span>
                              {auction.scheduledStartTime && (
                                <span className="text-xs text-gray-400">
                                  {new Date(auction.scheduledStartTime).toLocaleDateString()} at {new Date(auction.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </>
                          );
                        } else if (actualStatus === 'active') {
                          return (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-400 border border-green-500/20">
                              🟢 Live
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-400 border border-red-500/20">
                              🔴 Ended
                            </span>
                          );
                        }
                      })()}
                    </span>
                    <span className="text-yellow-400 font-semibold">₹{auction.currentPrice.toLocaleString('en-IN')}</span>
                    <span className="text-gray-300 font-mono">{formatTime(auction.remainingTime)}</span>
                    <span className="text-gray-300">{auction.participantCount || 0}</span>
                    <span className="flex items-center gap-2">
                      {(auction.status === 'scheduled' || auction.status === 'upcoming') && (
                        <>
                          {canStartAuction(auction) ? (
                            <button 
                              onClick={() => handleStartAuction(auction.id)}
                              disabled={startingAuctions.has(auction.id)}
                              className={`px-3 py-1 rounded-lg transition-all duration-300 border flex items-center gap-1 ${
                                startingAuctions.has(auction.id)
                                  ? 'text-amber-400 border-amber-500/20 bg-amber-900/20 cursor-not-allowed'
                                  : 'text-green-400 hover:text-green-300 hover:bg-green-900/20 border-green-500/20 hover:border-green-400/40'
                              }`}
                              title={startingAuctions.has(auction.id) ? "Starting auction..." : "Start Auction Now"}
                            >
                              {startingAuctions.has(auction.id) ? (
                                <>
                                  <div className="animate-spin w-3 h-3 border border-amber-400 border-t-transparent rounded-full"></div>
                                  <span className="text-xs">Starting...</span>
                                </>
                              ) : (
                                <>▶️</>
                              )}
                            </button>
                          ) : (
                            <div className="flex flex-col items-start gap-1">
                              <button 
                                disabled
                                className="px-3 py-1 rounded-lg text-gray-500 border border-gray-600/20 cursor-not-allowed opacity-50 flex items-center gap-1"
                                title={`Auction can start in ${getTimeUntilStart(auction) || 'soon'}`}
                              >
                                ⏳ <span className="text-xs">Waiting</span>
                              </button>
                              <span className="text-xs text-amber-400 font-medium">
                                {getTimeUntilStart(auction) ? `Starts in ${getTimeUntilStart(auction)}` : 'Ready soon'}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      {(auction.status === 'active' || auction.status === 'live') && (
                        <button 
                          onClick={() => handleStopAuction(auction.id)}
                          className="px-3 py-1 rounded-lg text-orange-400 hover:text-orange-300 hover:bg-orange-900/20 transition-all duration-300 border border-orange-500/20 hover:border-orange-400/40 flex items-center gap-1"
                          title="Stop Auction"
                        >
                          ⏹️ <span className="text-xs">Stop</span>
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