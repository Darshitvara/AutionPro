import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Users, 
  Settings,
  RefreshCw,
  Trophy,
  Zap,
  Calendar,
  Image,
  LogOut,
  Filter
} from 'lucide-react';
import { auctionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Format time in MM:SS format
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const AuctionCard = ({ auction, onJoinAuction, index }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second for real-time status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Real-time status calculation
  const getRealTimeStatus = () => {
    const now = currentTime;
    
    // If backend says it's closed/ended, it's definitively ended
    if (auction.status === 'closed' || auction.status === 'cancelled') {
      return 'ended';
    }
    
    // If backend says it's live and has remaining time, it's live
    if (auction.status === 'live') {
      const timeLeft = auction.endTime ? Math.max(0, auction.endTime - now) : 0;
      return timeLeft > 0 ? 'live' : 'ended';
    }
    
    // If scheduled start time exists, check if it's upcoming or ready
    if (auction.scheduledStartTime) {
      return now < auction.scheduledStartTime ? 'upcoming' : 'ready';
    }
    
    return auction.status;
  };

  const getStatusColor = () => {
    const status = getRealTimeStatus();
    switch (status) {
      case 'upcoming':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'ready':
        return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      case 'live':
        const timeLeft = auction.endTime ? Math.max(0, Math.floor((auction.endTime - currentTime) / 1000)) : 0;
        if (timeLeft <= 60) return 'text-red-400 bg-red-500/20 border-red-500/30';
        if (timeLeft <= 300) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'ended':
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusLabel = () => {
    const status = getRealTimeStatus();
    switch (status) {
      case 'upcoming': return 'UPCOMING';
      case 'ready': return 'READY';
      case 'live': return 'LIVE';
      case 'ended': return auction.winnerUsername ? 'SOLD' : 'ENDED';
      default: return status.toUpperCase();
    }
  };

  const realTimeStatus = getRealTimeStatus();
  const isLive = realTimeStatus === 'live';
  const isUpcoming = realTimeStatus === 'upcoming';
  const isReady = realTimeStatus === 'ready';
  const isEnded = realTimeStatus === 'ended';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -2 }}
      className="rounded-xl overflow-hidden group transition-all duration-300"
      style={{ 
        background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(39,39,42,0.6), rgba(0,0,0,0.8))', 
        backdropFilter: 'blur(20px)', 
        border: '1px solid rgba(255,215,0,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = '1px solid rgba(255,215,0,0.4)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(255,215,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = '1px solid rgba(255,215,0,0.2)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
      }}
    >
      <div className="relative">
        {auction.product?.image && auction.product.image !== 'https://via.placeholder.com/400x300?text=Auction+Item' ? (
          <img
            src={auction.product.image}
            alt={auction.product?.name || auction.productName || 'Auction Item'}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        {/* Fallback placeholder */}
        <div 
          className="w-full h-48 flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
            display: (!auction.product?.image || auction.product.image === 'https://via.placeholder.com/400x300?text=Auction+Item') ? 'flex' : 'none'
          }}
        >
          <div className="text-center">
            <Image className="w-12 h-12 mx-auto mb-2" style={{ color: '#666' }} />
            <p className="text-xs" style={{ color: '#666' }}>No Image Available</p>
          </div>
        </div>
        
        {/* Category Badge */}
        {auction.product?.category && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium"
            style={{ 
              background: 'rgba(0,0,0,0.7)', 
              color: '#FFD700',
              border: '1px solid rgba(255,215,0,0.3)'
            }}
          >
            {auction.product.category}
          </div>
        )}

        {/* Status Badge */}
        <div 
          className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor()}`}
          style={{ backgroundColor: isLive ? 'rgba(255,215,0,0.15)' : 'rgba(192,192,192,0.15)' }}
        >
          {getStatusLabel()}
        </div>

        {/* Participant Count */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs">
          <Users className="w-3 h-3" style={{ color: '#C0C0C0' }} />
          <span style={{ color: '#C0C0C0' }}>{auction.participantCount || 0}</span>
        </div>

        {/* Live Indicator */}
        {isLive && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-red-400">LIVE</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-display text-lg font-bold text-white mb-1 group-hover:text-yellow-300 transition-colors line-clamp-1">
            {auction.product?.name || auction.productName}
          </h3>
          <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: '#C0C0C0' }}>
            {auction.product?.description || 'Premium auction item with excellent quality and condition.'}
          </p>
        </div>

        <div className="space-y-3">
          {/* Price Info */}
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs" style={{ color: '#C0C0C0' }}>
                {isEnded ? 'Final Price' : 'Current Bid'}
              </div>
              <div className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                ₹{(isEnded ? auction.finalPrice || auction.currentPrice : auction.currentPrice).toLocaleString()}
              </div>
            </div>
            {auction.highestBidder && (
              <div className="text-right">
                <div className="text-xs text-gray-400">
                  {isEnded ? 'Winner' : 'Leading'}
                </div>
                <div className="flex items-center gap-1 text-xs text-yellow-500">
                  <Trophy className="w-3 h-3" />
                  <span className="truncate max-w-16">
                    {isEnded ? auction.winnerUsername || auction.highestBidder : auction.highestBidder}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="flex items-center justify-between py-2 px-3 glass rounded-xl">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-gray-300">
                {isUpcoming ? 'Starts in' : isEnded ? 'Ended' : 'Time left'}
              </span>
            </div>
            <div className="font-mono text-xs font-semibold">
              {(() => {
                if (isEnded) {
                  if (auction.actualEndTime) {
                    const endDate = new Date(auction.actualEndTime);
                    return endDate.toLocaleDateString();
                  }
                  return 'Complete';
                }
                if (isUpcoming) {
                  const timeToStart = Math.max(0, Math.floor((auction.scheduledStartTime - currentTime) / 1000));
                  return formatTime(timeToStart);
                }
                if (isLive && auction.endTime) {
                  const timeLeft = Math.max(0, Math.floor((auction.endTime - currentTime) / 1000));
                  return formatTime(timeLeft);
                }
                return '00:00';
              })()}
            </div>
          </div>

          {/* Action Button */}
          {isLive ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onJoinAuction(auction.id)}
              className="w-full btn-gradient text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm"
            >
              <Zap className="w-4 h-4" />
              Join Auction
            </motion.button>
          ) : isUpcoming || isReady ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onJoinAuction(auction.id, 'preview')}
              className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 text-sm"
            >
              <Calendar className="w-4 h-4" />
              {isReady ? 'Ready to Start' : 'Preview Room'}
            </motion.button>
          ) : isEnded ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onJoinAuction(auction.id, 'history')}
              className="w-full bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-300 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 text-sm"
            >
              <Trophy className="w-4 h-4" />
              View Results
            </motion.button>
          ) : (
            <button 
              disabled
              className="w-full bg-gray-800 text-gray-500 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed text-sm"
            >
              Auction Closed
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

function ModernAuctionList({ username, isAdmin, onJoinAuction, onShowAdminDashboard, notifications }) {
  // Add shimmer animation styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'live', 'upcoming', 'ended'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    fetchAuctions();
    const interval = setInterval(fetchAuctions, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAuctions = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      }
      
      setError(null);
      const response = await auctionAPI.getAll();
      if (response.success) {
        setAuctions(response.auctions || []);
      }
    } catch (error) {
      setError('Failed to load auctions');
      console.error('Failed to fetch auctions:', error);
    } finally {
      setLoading(false);
      if (isManualRefresh) {
        // Add slight delay for better UX
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  // Enhanced manual refresh with additional features
  const handleManualRefresh = async () => {
    // Prevent spam clicking
    if (isRefreshing) return;
    
    // Clear any existing errors
    setError(null);
    
    // Fetch fresh data
    await fetchAuctions(true);
    
    // Optional: Force update timers for all auction cards
    // This helps sync any time-dependent displays
    window.dispatchEvent(new Event('auctionRefresh'));
  };

  // Keyboard shortcut for refresh (Ctrl+R or F5)
  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
        e.preventDefault();
        handleManualRefresh();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRefreshing]);

  const filteredAuctions = auctions.filter(auction => {
    const now = Date.now();
    
    // Real-time status calculation for filtering
    const getRealTimeStatusForFilter = (auction) => {
      if (auction.status === 'closed' || auction.status === 'cancelled') {
        return 'ended';
      }
      
      if (auction.status === 'live') {
        const timeLeft = auction.endTime ? Math.max(0, auction.endTime - now) : 0;
        return timeLeft > 0 ? 'live' : 'ended';
      }
      
      if (auction.scheduledStartTime) {
        return now < auction.scheduledStartTime ? 'upcoming' : 'live';
      }
      
      return auction.status === 'upcoming' ? 'upcoming' : 'ended';
    };

    const realTimeStatus = getRealTimeStatusForFilter(auction);

    switch (filter) {
      case 'live': return realTimeStatus === 'live';
      case 'upcoming': return realTimeStatus === 'upcoming';
      case 'ended': return realTimeStatus === 'ended';
      default: return true;
    }
  });

  const stats = {
    total: auctions.length,
    live: auctions.filter(a => {
      const now = Date.now();
      if (a.status === 'live') {
        const timeLeft = a.endTime ? Math.max(0, a.endTime - now) : 0;
        return timeLeft > 0;
      }
      return false;
    }).length,
    upcoming: auctions.filter(a => {
      const now = Date.now();
      if (a.status === 'upcoming' || (a.scheduledStartTime && now < a.scheduledStartTime)) {
        return true;
      }
      return false;
    }).length,
    ended: auctions.filter(a => {
      const now = Date.now();
      if (a.status === 'closed' || a.status === 'cancelled') {
        return true;
      }
      if (a.status === 'live' && a.endTime) {
        const timeLeft = Math.max(0, a.endTime - now);
        return timeLeft === 0;
      }
      return false;
    }).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0A0A0A, #1a1a1a, #0A0A0A)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl p-8 text-center"
          style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,215,0,0.2)' }}
        >
          <div className="animate-spin w-12 h-12 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg" style={{ color: '#E5E5E5' }}>Loading auctions...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0A0A0A, #1a1a1a, #0A0A0A)' }}>
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50"
        style={{ background: 'rgba(0,0,0,0.95)', borderBottom: '1px solid rgba(255,215,0,0.2)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                Live Auctions
              </h1>
              <p className="mt-1" style={{ color: '#C0C0C0' }}>Discover and bid on premium items</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Clean Refresh Button */}
              <motion.div className="relative group">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="rounded-xl p-3 transition-all duration-300 relative overflow-hidden"
                  style={{ 
                    background: isRefreshing ? 'rgba(255,215,0,0.2)' : 'rgba(0,0,0,0.6)', 
                    border: '1px solid rgba(255,215,0,0.3)',
                    cursor: isRefreshing ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => !isRefreshing && (e.target.style.background = 'rgba(255,215,0,0.1)')}
                  onMouseLeave={(e) => !isRefreshing && (e.target.style.background = 'rgba(0,0,0,0.6)')}
                >
                  <motion.div
                    animate={{ rotate: isRefreshing ? 360 : 0 }}
                    transition={{ 
                      duration: isRefreshing ? 1 : 0,
                      repeat: isRefreshing ? Infinity : 0,
                      ease: "linear"
                    }}
                  >
                    <RefreshCw 
                      className="w-5 h-5" 
                      style={{ color: isRefreshing ? '#FFD700' : '#C0C0C0' }} 
                    />
                  </motion.div>
                  
                  {/* Subtle loading overlay */}
                  {isRefreshing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent"
                      style={{ 
                        background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.1), transparent)',
                        animation: 'shimmer 1.5s infinite'
                      }}
                    />
                  )}
                </motion.button>
                
                {/* Simple Tooltip */}
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  whileHover={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200"
                  style={{ 
                    background: 'rgba(0,0,0,0.95)', 
                    border: '1px solid rgba(255,215,0,0.3)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  {isRefreshing ? 'Refreshing...' : 'Refresh Auctions (F5)'}
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45 border-t border-l border-yellow-500/30"></div>
                </motion.div>
              </motion.div>

              {/* Admin Dashboard Button */}
              {isAdmin && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onShowAdminDashboard}
                  className="rounded-xl px-4 py-3 transition-colors flex items-center gap-2"
                  style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,215,0,0.3)', color: '#E5E5E5' }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,215,0,0.1)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.6)'}
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </motion.button>
              )}

              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{username}</div>
                  <div className="text-xs" style={{ color: '#C0C0C0' }}>{isAdmin ? 'Administrator' : 'Bidder'}</div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="rounded-xl px-4 py-3 text-red-400 transition-colors flex items-center gap-2"
                  style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(239,68,68,0.3)' }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(239,68,68,0.1)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.6)'}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 relative z-10"
        >
          {[
            { label: 'Total', value: stats.total, color: 'text-blue-400', bg: 'rgba(59,130,246,0.1)' },
            { label: 'Live', value: stats.live, color: 'text-green-400', bg: 'rgba(34,197,94,0.1)' },
            { label: 'Upcoming', value: stats.upcoming, color: 'text-yellow-400', bg: 'rgba(255,215,0,0.1)' },
            { label: 'Ended', value: stats.ended, color: 'rgba(192,192,192,1)', bg: 'rgba(128,128,128,0.1)' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-xl p-3 text-center relative z-10"
              style={{ 
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,215,0,0.2)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className={`text-xl font-bold ${stat.color}`} style={stat.label === 'Ended' ? { color: stat.color } : {}}>{stat.value}</div>
              <div className="text-xs" style={{ color: '#C0C0C0' }}>{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 mb-8 overflow-x-auto relative z-20"
        >
          {[
            { key: 'all', label: 'All Auctions', icon: Filter },
            { key: 'live', label: 'Live Now', icon: Zap },
            { key: 'upcoming', label: 'Upcoming', icon: Calendar },
            { key: 'ended', label: 'Ended', icon: Trophy },
          ].map(({ key, label, icon: Icon }) => (
            <motion.button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap relative z-30 ${
                filter === key
                  ? 'text-black shadow-lg'
                  : 'text-white hover:text-yellow-300'
              }`}
              style={filter === key ? {
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                border: '1px solid rgba(255,215,0,0.5)',
                transform: 'translateZ(0)' // Force hardware acceleration
              } : {
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,215,0,0.2)',
                backdropFilter: 'blur(10px)',
                transform: 'translateZ(0)' // Force hardware acceleration
              }}
              onMouseEnter={(e) => {
                if (filter !== key) {
                  e.target.style.background = 'rgba(255,215,0,0.1)';
                  e.target.style.borderColor = 'rgba(255,215,0,0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== key) {
                  e.target.style.background = 'rgba(0,0,0,0.6)';
                  e.target.style.borderColor = 'rgba(255,215,0,0.2)';
                }
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </motion.button>
          ))}
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-8 text-center border border-red-500/20"
          >
            <div className="text-red-400 text-lg mb-4">⚠️ {error}</div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchAuctions}
              className="btn-gradient text-white px-6 py-2 rounded-xl"
            >
              Try Again
            </motion.button>
          </motion.div>
        )}

        {/* Auctions Grid */}
        {filteredAuctions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-12 text-center"
          >
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Auctions Found</h3>
            <p className="text-gray-400 mb-6">
              {filter === 'all' 
                ? 'No auctions available at the moment.'
                : `No ${filter} auctions found.`
              }
            </p>
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onShowAdminDashboard}
                className="btn-gradient text-white px-6 py-3 rounded-xl flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Create New Auction
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <AnimatePresence>
              {filteredAuctions.map((auction, index) => (
                <AuctionCard
                  key={auction.id}
                  auction={auction}
                  onJoinAuction={onJoinAuction}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default ModernAuctionList;