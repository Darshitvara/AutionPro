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
  const [stoppingAuctions, setStoppingAuctions] = useState(new Set()); // Track auctions being stopped
  // Stop confirmation modal state
  const [confirmStopOpen, setConfirmStopOpen] = useState(false);
  const [confirmStopAuction, setConfirmStopAuction] = useState(null);
  // Start confirmation modal state
  const [confirmStartOpen, setConfirmStartOpen] = useState(false);
  const [confirmStartAuction, setConfirmStartAuction] = useState(null);
  // Delete confirmation modal state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteAuction, setConfirmDeleteAuction] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  // Destructure pagination values for easier access
  const { currentPage, totalPages, totalCount, limit, hasNextPage, hasPrevPage } = pagination;
  
  // Sorting state
  const [sortBy, setSortBy] = useState('scheduledStartTime');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
    // Force initial load with explicit parameters
    const initialLoad = async () => {
      await fetchAuctions(1, 10);
      setIsInitialLoad(false);
    };
    
    initialLoad();
  }, []);

  // Fetch auctions when sorting changes (but not on initial load)
  useEffect(() => {
    if (isInitialLoad) {
      return;
    }
    
    if (currentPage !== 1) {
      // If not on first page, reset to first page and fetch
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      fetchAuctions(1, 10);
    } else {
      // If already on first page, just fetch with new sorting
      fetchAuctions(1, 10);
    }
  }, [sortBy, sortOrder, isInitialLoad]);

  // Update current time every 15 seconds to check auction start times more responsively
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000); // Update every 15 seconds for better responsiveness

    return () => clearInterval(timeInterval);
  }, []);

  const fetchAuctions = async (page = 1, limitOverride = 10) => {
    try {
      setLoading(true);
      
      const actualPage = page || 1;
      const actualLimit = limitOverride || 10;
      const skip = (actualPage - 1) * actualLimit;
      
      const response = await auctionAPI.getAll({
        page: actualPage,
        limit: actualLimit,
        sortBy: sortBy || 'scheduledStartTime',
        sortOrder: sortOrder || 'desc'
      });
      
      if (response.success) {
        let auctionsData, paginationData;
        
        if (response.data && response.data.auctions) {
          // New nested structure
          auctionsData = response.data.auctions;
          paginationData = response.data.pagination;
        } else {
          // Flat structure with manual pagination
          const allAuctions = response.auctions || [];
          const totalCount = allAuctions.length;
          
          // Apply manual pagination
          const startIndex = skip;
          const endIndex = startIndex + actualLimit;
          auctionsData = allAuctions.slice(startIndex, endIndex);
          
          // Create pagination data
          const totalPages = Math.ceil(totalCount / actualLimit);
          
          paginationData = {
            currentPage: actualPage,
            totalPages: totalPages,
            totalCount: totalCount,
            limit: actualLimit,
            hasNextPage: actualPage < totalPages,
            hasPrevPage: actualPage > 1
          };
        }
        
        setAuctions(auctionsData || []);
        setPagination(paginationData);
        
      } else {
        toast.error('Failed to fetch auctions');
      }
    } catch (error) {
      console.error('Fetch auctions error:', error);
      toast.error('Failed to fetch auctions');
    } finally {
      setLoading(false);
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

    // Validate that start date is not in the past
    const startDate = new Date(formData.scheduledStartTime);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (isNaN(startDate.getTime())) {
      toast.error('Please select a valid date');
      return;
    }
    
    if (startDate < todayStart) {
      toast.error('Scheduled start date cannot be in the past');
      return;
    }

    // Smart scheduling: If today's date is selected, schedule it for current time + 2 minutes
    // This satisfies backend validation while allowing "today" scheduling
    let actualStartTime;
    const isToday = startDate.toDateString() === today.toDateString();
    
    if (isToday) {
      // For today's auctions, schedule 2 minutes from now to satisfy backend validation
      actualStartTime = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
    } else {
      // For future dates, use the selected date
      actualStartTime = startDate;
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
        scheduledStartTime: actualStartTime.toISOString(),
        durationMinutes: parseInt(formData.durationMinutes)
      });

      if (response.success) {
        if (isToday) {
          toast.success('Auction scheduled for today! You can manually start it after 2 minutes.');
          
          // Set up a timer to update the UI when the auction becomes startable
          setTimeout(() => {
            setCurrentTime(new Date());
            
            // Show a gentle notification that the auction is now ready to start manually
            toast.success('Auction is now ready to start manually!', {
              duration: 4000,
              style: {
                background: '#059669',
                color: '#ffffff',
              }
            });
          }, 2 * 60 * 1000 + 5000); // 2 minutes + 5 seconds buffer for safety
        } else {
          toast.success('Auction scheduled successfully! You can start it manually after the scheduled time.');
        }
        
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
        fetchAuctions(currentPage, limit);
      }
    } catch (error) {
      console.error('[FRONTEND] Create auction error:', error);
      console.error('[FRONTEND] Error response data:', error.response?.data);
      console.error('[FRONTEND] Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create auction';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAuction = (auctionId, productName) => {
    const auction = auctions.find(a => a.id === auctionId);
    setConfirmDeleteAuction(auction || { id: auctionId, productName });
    setConfirmDeleteOpen(true);
  };

  const deleteAuctionConfirmed = async () => {
    if (!confirmDeleteAuction) return;

    try {
      const response = await auctionAPI.delete(confirmDeleteAuction.id);
      if (response.success) {
        toast.success('Auction deleted successfully');
        fetchAuctions(currentPage, limit);
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete auction';
      toast.error(message);
    } finally {
      setConfirmDeleteOpen(false);
      setConfirmDeleteAuction(null);
    }
  };

  const startAuctionConfirmed = async (auctionId) => {
    // Add to starting set to show loading state
    setStartingAuctions(prev => new Set(prev).add(auctionId));

    try {
      const response = await auctionAPI.start(auctionId);
      if (response.success) {
        toast.success(`Auction started successfully! The auction is now live and will end at ${new Date(response.auction?.endTime || Date.now() + 5*60*1000).toLocaleTimeString()}`);
        
        // Optimistically update the auction status in the UI
        setAuctions(prevAuctions => 
          prevAuctions.map(auction => 
            auction.id === auctionId 
              ? { 
                  ...auction, 
                  status: 'live',
                  actualStartTime: response.auction?.actualStartTime || new Date().toISOString(),
                  endTime: response.auction?.endTime
                }
              : auction
          )
        );
        
        // Fetch latest data to ensure consistency
        setTimeout(() => {
          fetchAuctions(currentPage, limit);
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
      setConfirmStartOpen(false);
      setConfirmStartAuction(null);
    }
  };

  const handleStartAuction = (auctionId) => {
    const auction = auctions.find(a => a.id === auctionId);
    setConfirmStartAuction(auction || { id: auctionId });
    setConfirmStartOpen(true);
  };

  const stopAuctionConfirmed = async (auctionId) => {
    // Add to stopping set to show loading state
    setStoppingAuctions(prev => new Set(prev).add(auctionId));
    try {
      const response = await auctionAPI.stop(auctionId);
      if (response.success) {
        const successMessage = response.verification 
          ? `Auction stopped successfully! ${response.verification.winner ? `Winner: ${response.verification.winner} with ₹${response.verification.finalPrice?.toLocaleString('en-IN')}` : 'No bids received.'}`
          : 'Auction stopped successfully! The auction has ended.';
        toast.success(successMessage);

        const updatedAuctionData = response.auction || response.verification || {};
        setAuctions(prevAuctions => 
          prevAuctions.map(auction => 
            auction.id === auctionId 
              ? { 
                  ...auction, 
                  status: updatedAuctionData.status || 'closed',
                  manuallyEnded: updatedAuctionData.manuallyEnded || true,
                  endedBy: updatedAuctionData.endedBy,
                  winnerId: updatedAuctionData.winnerId,
                  winnerUsername: updatedAuctionData.winnerUsername || updatedAuctionData.winner,
                  finalPrice: updatedAuctionData.finalPrice,
                  isActive: false
                }
              : auction
          )
        );

        // Verify with fresh fetch
        setTimeout(async () => {
          try {
            const updatedResponse = await auctionAPI.getAll();
            if (updatedResponse.success) {
              const stoppedAuction = updatedResponse.auctions.find(a => a.id === auctionId);
              if (!stoppedAuction || (stoppedAuction.status === 'closed' || stoppedAuction.status === 'ended')) {
                setAuctions(updatedResponse.auctions);
              } else {
                // Fallback UI update if backend hasn’t reflected yet
                setAuctions(prevAuctions => 
                  prevAuctions.map(auction => 
                    auction.id === auctionId 
                      ? { ...auction, status: 'closed', isActive: false, manuallyEnded: true, _uiOverride: true }
                      : auction
                  )
                );
                toast.warning('Stop command sent. If status does not update yet, backend may still be processing.');
              }
            }
          } catch (fetchError) {
            console.error('[FRONTEND] Error fetching updated auctions:', fetchError);
          }
        }, 1500);
      } else {
        toast.error(`Failed to stop auction: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Failed to stop auction';
      toast.error(`Error stopping auction: ${message}`);
    } finally {
      setStoppingAuctions(prev => {
        const newSet = new Set(prev);
        newSet.delete(auctionId);
        return newSet;
      });
      setConfirmStopOpen(false);
      setConfirmStopAuction(null);
    }
  };

  const handleStopAuction = (auctionId) => {
    const auction = auctions.find(a => a.id === auctionId);
    setConfirmStopAuction(auction || { id: auctionId });
    setConfirmStopOpen(true);
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ 
      ...prev, 
      currentPage: page 
    }));
    fetchAuctions(page, limit || 10);
  };

  const handleSort = (field) => {
    const newSortOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(field);
    setSortOrder(newSortOrder);
    setPagination(prev => ({ 
      ...prev, 
      currentPage: 1 
    }));
    fetchAuctions(1, limit || 10);
  };

  const formatTime = (seconds) => {
    if (seconds <= 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format time until auction starts (for scheduled auctions)
  const formatTimeUntilStart = (auction) => {
    if (!auction.scheduledStartTime) return 'Not scheduled';
    
    const scheduledTime = new Date(auction.scheduledStartTime);
    const now = new Date();
    const timeDiff = scheduledTime - now;
    
    // If auction has already started or passed
    if (timeDiff <= 0) return 'Started';
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    // Check if it's today
    const today = new Date();
    const isToday = scheduledTime.toDateString() === today.toDateString();
    
    if (isToday) {
      if (hours === 0 && minutes === 0) {
        return 'Starting now';
      } else if (hours === 0) {
        return `Today (${minutes}m)`;
      } else {
        return `Today (${hours}h ${minutes}m)`;
      }
    }
    
    // Check if it's tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isTomorrow = scheduledTime.toDateString() === tomorrow.toDateString();
    
    if (isTomorrow) {
      return `Tomorrow (${hours}h ${minutes}m)`;
    }
    
    // For other days
    if (days === 0) {
      return `${hours}h ${minutes}m`;
    } else if (days === 1) {
      return `1 day`;
    } else {
      return `${days} days`;
    }
  };

  // Check if auction can be started based on scheduled time (manual start only)
  const canStartAuction = (auction) => {
    if (!auction.scheduledStartTime) return false;
    const scheduledTime = new Date(auction.scheduledStartTime);
    const sevenDaysAfterScheduled = new Date(scheduledTime.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Can only start if current time is after scheduled time but before 7-day expiration
    return currentTime >= scheduledTime && currentTime <= sevenDaysAfterScheduled;
  };

  // Check if auction has expired (7 days past scheduled start time without being started)
  const isAuctionExpired = (auction) => {
    if (!auction.scheduledStartTime) return false;
    if (auction.status === 'live' || auction.status === 'active' || auction.status === 'closed' || auction.status === 'ended') {
      return false; // Already started or ended, not expired
    }
    
    const scheduledTime = new Date(auction.scheduledStartTime);
    const sevenDaysAfterScheduled = new Date(scheduledTime.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return currentTime > sevenDaysAfterScheduled;
  };

  // Get the actual status of auction based on scheduled time and backend status
  const getActualAuctionStatus = (auction) => {
    // Handle backend status values (upcoming, live, closed) and convert to frontend display values
    
    // If backend says it's live/active, show as active
    if (auction.status === 'live' || auction.status === 'active') return 'active';
    
    // If backend says it's closed/ended, show as ended
    if (auction.status === 'closed' || auction.status === 'ended') return 'ended';
    
    // Check if auction has expired (7 days past scheduled start without being started)
    if (isAuctionExpired(auction)) {
      return 'expired';
    }
    
    // If auction has a scheduled start time, determine its status
    if (auction.scheduledStartTime) {
      const scheduledTime = new Date(auction.scheduledStartTime);
      
      if (currentTime < scheduledTime) {
        // Future scheduled auction
        return 'scheduled';
      } else {
        // Past scheduled time but not started - waiting for manual start
        return 'waiting-for-start';
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
                <label className="block text-gray-300 font-medium mb-2">
                  Scheduled Start Date *
                  <span className="text-xs text-gray-400 ml-2">(Today onwards)</span>
                </label>
                <DatePicker
                  selected={formData.scheduledStartTime ? new Date(formData.scheduledStartTime) : null}
                  onChange={(date) => setFormData(prev => ({ 
                    ...prev, 
                    scheduledStartTime: date ? date.toISOString() : '' 
                  }))}
                  dateFormat="MMM d, yyyy"
                  minDate={new Date()} // Allow from today onwards
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
                  💡 Simple date selection: Choose any day starting from today
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
                    {(() => {
                      const selectedDate = new Date(formData.scheduledStartTime);
                      const today = new Date();
                      const isToday = selectedDate.toDateString() === today.toDateString();
                      
                      if (isToday) {
                        return (
                          <div className="text-xs text-amber-300 mt-2 p-2 bg-amber-900/20 rounded border border-amber-500/30">
                            🕒 <strong>Today's Auction:</strong> Will be scheduled for a few minutes from now and can be started manually.
                          </div>
                        );
                      }
                      return null;
                    })()}
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
            Existing Auctions ({totalCount > 0 ? totalCount : auctions.length})
          </h3>

          {/* Table Controls */}
          {auctions.length > 0 && (
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-400">Show:</label>
                  <select
                    value={limit}
                    onChange={(e) => {
                      const newLimit = parseInt(e.target.value);
                      setPagination(prev => ({ 
                        ...prev, 
                        limit: newLimit,
                        currentPage: 1 
                      }));
                      fetchAuctions(1, newLimit);
                    }}
                    className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-400">entries</span>
                </div>
                {sortBy && (
                  <div className="text-sm text-gray-400">
                    Sorted by: <span className="text-yellow-400">{sortBy}</span> 
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-400">
                Page {currentPage} of {totalPages} ({totalCount} total)
              </div>
            </div>
          )}
          
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
                  <button 
                    onClick={() => handleSort('productName')}
                    className="font-medium text-yellow-400 hover:text-yellow-300 text-left flex items-center gap-1"
                  >
                    Product
                    {sortBy === 'productName' && (
                      <span className="text-xs">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => handleSort('status')}
                    className="font-medium text-yellow-400 hover:text-yellow-300 text-left flex items-center gap-1"
                  >
                    Status
                    {sortBy === 'status' && (
                      <span className="text-xs">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => handleSort('currentPrice')}
                    className="font-medium text-yellow-400 hover:text-yellow-300 text-left flex items-center gap-1"
                  >
                    Current Price
                    {sortBy === 'currentPrice' && (
                      <span className="text-xs">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => handleSort('createdAt')}
                    className="font-medium text-yellow-400 hover:text-yellow-300 text-left flex items-center gap-1"
                  >
                    Time
                    {sortBy === 'createdAt' && (
                      <span className="text-xs">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
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
                        } else if (actualStatus === 'waiting-for-start') {
                          return (
                            <>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-900/50 text-amber-400 border border-amber-500/20 mb-1">
                                ⏳ Waiting for Start
                              </span>
                              <span className="text-xs text-gray-400">
                                Ready to start manually
                              </span>
                            </>
                          );
                        } else if (actualStatus === 'expired') {
                          return (
                            <>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-400 border border-red-500/20 mb-1">
                                ⏰ Expired
                              </span>
                              <span className="text-xs text-gray-400">
                                Not started within 7 days
                              </span>
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
                    <span className={`font-mono text-sm ${(() => {
                      const actualStatus = getActualAuctionStatus(auction);
                      const timeText = (() => {
                        // For live auctions, show "now"
                        if (actualStatus === 'active') {
                          return 'now';
                        }
                        
                        // For scheduled auctions, show time until start
                        if (actualStatus === 'scheduled') {
                          return formatTimeUntilStart(auction);
                        }
                        
                        // For waiting-for-start auctions, show "Ready"
                        if (actualStatus === 'waiting-for-start') {
                          return 'Ready';
                        }
                        
                        // For expired auctions, show "Expired"
                        if (actualStatus === 'expired') {
                          return 'Expired';
                        }
                        
                        // For ended auctions
                        if (actualStatus === 'ended') {
                          return 'Ended';
                        }
                        
                        // Default fallback
                        return 'N/A';
                      })();
                      
                      // Determine color based on status and time
                      if (actualStatus === 'active') {
                        return 'text-green-400 font-semibold'; // Green for live/now
                      } else if (actualStatus === 'scheduled') {
                        if (timeText.includes('Today')) {
                          return 'text-amber-400'; // Amber for today
                        } else if (timeText.includes('Tomorrow')) {
                          return 'text-blue-400'; // Blue for tomorrow
                        } else {
                          return 'text-gray-300'; // Gray for future
                        }
                      } else if (actualStatus === 'waiting-for-start') {
                        return 'text-amber-400 font-semibold'; // Amber for ready to start
                      } else if (actualStatus === 'expired') {
                        return 'text-red-400'; // Red for expired
                      } else {
                        return 'text-gray-500'; // Gray for ended
                      }
                    })()}`}>
                      {(() => {
                        const actualStatus = getActualAuctionStatus(auction);
                        
                        // For live auctions, show "now"
                        if (actualStatus === 'active') {
                          return 'now';
                        }
                        
                        // For scheduled auctions, show time until start
                        if (actualStatus === 'scheduled') {
                          return formatTimeUntilStart(auction);
                        }
                        
                        // For waiting-for-start auctions, show "Ready"
                        if (actualStatus === 'waiting-for-start') {
                          return 'Ready';
                        }
                        
                        // For expired auctions, show "Expired"
                        if (actualStatus === 'expired') {
                          return 'Expired';
                        }
                        
                        // For ended auctions
                        if (actualStatus === 'ended') {
                          return 'Ended';
                        }
                        
                        // Default fallback
                        return 'N/A';
                      })()}
                    </span>
                    <span className="text-gray-300">{auction.participantCount || 0}</span>
                    <span className="flex items-center gap-2">
                      {(() => {
                        const actualStatus = getActualAuctionStatus(auction);
                        
                        // Show start button for scheduled auctions that can be started and waiting-for-start auctions
                        if ((actualStatus === 'scheduled' && canStartAuction(auction)) || actualStatus === 'waiting-for-start') {
                          return (
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
                          );
                        }
                        
                        // Show waiting message for scheduled auctions that can't be started yet
                        if (actualStatus === 'scheduled' && !canStartAuction(auction)) {
                          return (
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
                          );
                        }
                        
                        // Show stop button for active auctions
                        if (actualStatus === 'active') {
                          return (
                            <button 
                              onClick={() => handleStopAuction(auction.id || auction._id)}
                              disabled={stoppingAuctions.has(auction.id || auction._id)}
                              className={`px-3 py-1 rounded-lg transition-all duration-300 border flex items-center gap-1 ${
                                stoppingAuctions.has(auction.id || auction._id)
                                  ? 'text-amber-400 border-amber-500/20 bg-amber-900/20 cursor-not-allowed'
                                  : 'text-red-400 hover:text-red-300 hover:bg-red-900/20 border-red-500/20 hover:border-red-400/40'
                              }`}
                              title={stoppingAuctions.has(auction.id || auction._id) ? "Stopping auction..." : "Stop Auction"}
                            >
                              {stoppingAuctions.has(auction.id || auction._id) ? (
                                <>
                                  <div className="animate-spin w-3 h-3 border border-amber-400 border-t-transparent rounded-full"></div>
                                  <span className="text-xs">Stopping...</span>
                                </>
                              ) : (
                                <>⏹️</>
                              )}
                            </button>
                          );
                        }
                        
                        // Show expired or ended status with no action
                        if (actualStatus === 'expired') {
                          return (
                            <span className="px-3 py-1 rounded-lg text-red-400 border border-red-500/20 bg-red-900/20 text-xs">
                              ❌ Expired
                            </span>
                          );
                        }
                        
                        // For ended auctions or other states
                        return (
                          <span className="px-3 py-1 rounded-lg text-gray-500 border border-gray-600/20 bg-gray-900/20 text-xs">
                            ✅ Completed
                          </span>
                        );
                      })()}
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

              {/* Pagination Controls */}
              <div className="mt-6 flex items-center justify-between border-t border-yellow-500/20 bg-gradient-to-r from-yellow-900/10 to-yellow-800/10 px-4 py-3 sm:px-6 rounded-b-lg">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                    disabled={!hasPrevPage}
                    className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 ${
                      hasPrevPage
                        ? 'border border-yellow-500/30 bg-black/40 text-yellow-400 hover:bg-yellow-900/20 hover:text-yellow-300 hover:border-yellow-400/50'
                        : 'border border-gray-600/30 bg-gray-900/40 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => hasNextPage && handlePageChange(currentPage + 1)}
                    disabled={!hasNextPage}
                    className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 ${
                      hasNextPage
                        ? 'border border-yellow-500/30 bg-black/40 text-yellow-400 hover:bg-yellow-900/20 hover:text-yellow-300 hover:border-yellow-400/50'
                        : 'border border-gray-600/30 bg-gray-900/40 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-300">
                      Showing{' '}
                      <span className="font-medium text-yellow-400">
                        {auctions.length === 0 ? 0 : (currentPage - 1) * limit + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium text-yellow-400">
                        {Math.min(currentPage * limit, totalCount)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium text-yellow-400">{totalCount}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md" aria-label="Pagination">
                      <button
                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                        disabled={!hasPrevPage}
                        className={`relative inline-flex items-center rounded-l-md px-2 py-2 ring-1 ring-inset transition-all duration-300 focus:z-20 focus:outline-offset-0 ${
                          !hasPrevPage 
                            ? 'cursor-not-allowed opacity-50 text-gray-500 ring-gray-600/30 bg-gray-900/40' 
                            : 'text-yellow-400 ring-yellow-500/30 bg-black/40 hover:bg-yellow-900/20 hover:text-yellow-300 hover:ring-yellow-400/50'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {/* Page Numbers */}
                      {(() => {
                        const pages = [];
                        const startPage = Math.max(1, currentPage - 2);
                        const endPage = Math.min(totalPages, currentPage + 2);

                        if (startPage > 1) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => handlePageChange(1)}
                              className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-yellow-400 ring-1 ring-inset ring-yellow-500/30 bg-black/40 hover:bg-yellow-900/20 hover:text-yellow-300 hover:ring-yellow-400/50 focus:z-20 focus:outline-offset-0 transition-all duration-300"
                            >
                              1
                            </button>
                          );
                          if (startPage > 2) {
                            pages.push(
                              <span key="ellipsis1" className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-gray-600/30 bg-gray-900/40 focus:outline-offset-0">
                                ...
                              </span>
                            );
                          }
                        }

                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => handlePageChange(i)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset focus:z-20 focus:outline-offset-0 transition-all duration-300 ${
                                i === currentPage
                                  ? 'z-10 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black ring-yellow-500 shadow-lg shadow-yellow-500/25'
                                  : 'text-yellow-400 ring-yellow-500/30 bg-black/40 hover:bg-yellow-900/20 hover:text-yellow-300 hover:ring-yellow-400/50'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }

                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span key="ellipsis2" className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-gray-600/30 bg-gray-900/40 focus:outline-offset-0">
                                ...
                              </span>
                            );
                          }
                          pages.push(
                            <button
                              key={totalPages}
                              onClick={() => handlePageChange(totalPages)}
                              className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-yellow-400 ring-1 ring-inset ring-yellow-500/30 bg-black/40 hover:bg-yellow-900/20 hover:text-yellow-300 hover:ring-yellow-400/50 focus:z-20 focus:outline-offset-0 transition-all duration-300"
                            >
                              {totalPages}
                            </button>
                          );
                        }

                        return pages;
                      })()}

                      <button
                        onClick={() => hasNextPage && handlePageChange(currentPage + 1)}
                        disabled={!hasNextPage}
                        className={`relative inline-flex items-center rounded-r-md px-2 py-2 ring-1 ring-inset transition-all duration-300 focus:z-20 focus:outline-offset-0 ${
                          !hasNextPage 
                            ? 'cursor-not-allowed opacity-50 text-gray-500 ring-gray-600/30 bg-gray-900/40' 
                            : 'text-yellow-400 ring-yellow-500/30 bg-black/40 hover:bg-yellow-900/20 hover:text-yellow-300 hover:ring-yellow-400/50'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Start Auction Confirmation Modal */}
      {confirmStartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { setConfirmStartOpen(false); setConfirmStartAuction(null); }}
          />
          {/* Modal */}
          <div
            className="relative z-10 w-full max-w-md mx-4 rounded-2xl p-6"
            style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(39,39,42,0.85))', border: '1px solid rgba(255,215,0,0.2)' }}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Start Auction?
              </h3>
              <button
                onClick={() => { setConfirmStartOpen(false); setConfirmStartAuction(null); }}
                className="text-gray-400 hover:text-white"
                aria-label="Close"
              >
                ✖
              </button>
            </div>
            <div className="space-y-2">
              <div className="text-white font-medium">{confirmStartAuction?.productName || 'Selected Auction'}</div>
              {confirmStartAuction?.scheduledStartTime && (
                <div className="text-sm text-gray-300">
                  Scheduled: {new Date(confirmStartAuction.scheduledStartTime).toLocaleString()}
                </div>
              )}
              <p className="text-sm text-gray-400 mt-2">
                This will make the auction live immediately. It will run for its configured duration and accept real-time bids.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => { setConfirmStartOpen(false); setConfirmStartAuction(null); }}
                className="px-4 py-2 rounded-lg text-gray-300 border border-gray-600 hover:bg-gray-800/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmStartAuction && startAuctionConfirmed(confirmStartAuction.id)}
                disabled={confirmStartAuction && startingAuctions.has(confirmStartAuction.id)}
                className={`px-4 py-2 rounded-lg font-semibold text-black transition-all ${
                  confirmStartAuction && startingAuctions.has(confirmStartAuction.id)
                    ? 'opacity-70 cursor-not-allowed'
                    : ''
                }`}
                style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', border: '1px solid rgba(255,215,0,0.4)' }}
              >
                {confirmStartAuction && startingAuctions.has(confirmStartAuction.id) ? 'Starting…' : 'Start Now'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Stop Auction Confirmation Modal */}
      {confirmStopOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { setConfirmStopOpen(false); setConfirmStopAuction(null); }}
          />
          {/* Modal */}
          <div
            className="relative z-10 w-full max-w-md mx-4 rounded-2xl p-6"
            style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(39,39,42,0.85))', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold text-red-400">
                Stop Auction?
              </h3>
              <button
                onClick={() => { setConfirmStopOpen(false); setConfirmStopAuction(null); }}
                className="text-gray-400 hover:text-white"
                aria-label="Close"
              >
                ✖
              </button>
            </div>
            <div className="space-y-2">
              <div className="text-white font-medium">{confirmStopAuction?.productName || 'Selected Auction'}</div>
              <p className="text-sm text-gray-300">
                This will immediately end the auction and finalize the current highest bidder as the winner.
              </p>
              <div className="text-xs text-gray-400">
                This action cannot be undone.
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => { setConfirmStopOpen(false); setConfirmStopAuction(null); }}
                className="px-4 py-2 rounded-lg text-gray-300 border border-gray-600 hover:bg-gray-800/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmStopAuction && stopAuctionConfirmed(confirmStopAuction.id)}
                disabled={confirmStopAuction && stoppingAuctions.has(confirmStopAuction.id)}
                className={`px-4 py-2 rounded-lg font-semibold text-white transition-all ${
                  confirmStopAuction && stoppingAuctions.has(confirmStopAuction.id)
                    ? 'opacity-70 cursor-not-allowed'
                    : ''
                }`}
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', border: '1px solid rgba(239,68,68,0.5)' }}
              >
                {confirmStopAuction && stoppingAuctions.has(confirmStopAuction.id) ? 'Stopping…' : 'Stop Now'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Auction Confirmation Modal */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { setConfirmDeleteOpen(false); setConfirmDeleteAuction(null); }}
          />
          {/* Modal */}
          <div
            className="relative z-10 w-full max-w-md mx-4 rounded-2xl p-6"
            style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(39,39,42,0.85))', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold text-red-400">
                Delete Auction?
              </h3>
              <button
                onClick={() => { setConfirmDeleteOpen(false); setConfirmDeleteAuction(null); }}
                className="text-gray-400 hover:text-white"
                aria-label="Close"
              >
                ✖
              </button>
            </div>
            <div className="space-y-2">
              <div className="text-white font-medium">{confirmDeleteAuction?.productName || 'Selected Auction'}</div>
              <p className="text-sm text-gray-300">
                This will permanently delete the auction and all associated data.
              </p>
              <div className="text-xs text-red-400 font-medium">
                ⚠️ This action cannot be undone!
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => { setConfirmDeleteOpen(false); setConfirmDeleteAuction(null); }}
                className="px-4 py-2 rounded-lg text-gray-300 border border-gray-600 hover:bg-gray-800/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteAuctionConfirmed}
                className="px-4 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', border: '1px solid rgba(239,68,68,0.5)' }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;