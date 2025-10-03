import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Users, 
  TrendingUp, 
  Settings, 
  LogOut,
  RefreshCw,
  Plus,
  Trophy,
  Zap,
  Calendar,
  Filter
} from 'lucide-react';
import { auctionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AuctionCard = ({ auction, onJoinAuction, index }) => {
  const formatTime = (seconds) => {
    if (seconds <= 0) return "Ended";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusColor = () => {
    if (!auction.isActive) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (auction.remainingTime <= 60) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    return 'text-green-400 bg-green-500/10 border-green-500/20';
  };

  const isLive = auction.isActive && auction.remainingTime > 0;
  const isUpcoming = auction.startTime > Date.now();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -2 }}
      className="glass rounded-xl overflow-hidden group hover:shadow-glow transition-all duration-300"
    >
      <div className="relative">
        <img
          src={auction.product?.image || 'https://via.placeholder.com/400x300?text=Auction+Item'}
          alt={auction.product?.name || auction.productName}
          className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Status Badge */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor()}`}>
          {isUpcoming ? 'Upcoming' : isLive ? 'Live' : 'Ended'}
        </div>

        {/* Quick Stats */}
        <div className="absolute top-2 right-2 glass rounded-lg p-1.5">
          <div className="flex items-center gap-1 text-xs">
            <Users className="w-3 h-3" />
            <span>{auction.participantCount || 0}</span>
          </div>
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
          <h3 className="font-display text-lg font-bold text-white mb-1 group-hover:text-purple-300 transition-colors line-clamp-1">
            {auction.product?.name || auction.productName}
          </h3>
          <p className="text-gray-400 text-xs line-clamp-1">
            {auction.product?.description || 'Premium auction item with excellent quality.'}
          </p>
        </div>

        <div className="space-y-3">
          {/* Price Info */}
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-400">Current Bid</div>
              <div className="text-lg font-bold text-white">
                ₹{auction.currentPrice.toLocaleString()}
              </div>
            </div>
            {auction.highestBidder && (
              <div className="text-right">
                <div className="text-xs text-gray-400">Leading</div>
                <div className="flex items-center gap-1 text-xs text-yellow-500">
                  <Trophy className="w-3 h-3" />
                  <span className="truncate max-w-16">{auction.highestBidder}</span>
                </div>
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="flex items-center justify-between py-2 px-3 glass rounded-xl">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-gray-300">
                {isUpcoming ? 'Starts in' : 'Time left'}
              </span>
            </div>
            <div className="font-mono text-xs font-semibold">
              {isUpcoming 
                ? formatTime(Math.max(0, Math.floor((auction.startTime - Date.now()) / 1000)))
                : formatTime(auction.remainingTime)
              }
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
          ) : isUpcoming ? (
            <button 
              disabled
              className="w-full bg-gray-700 text-gray-400 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed text-sm"
            >
              <Calendar className="w-4 h-4" />
              Coming Soon
            </button>
          ) : (
            <button 
              disabled
              className="w-full bg-gray-800 text-gray-500 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed text-sm"
            >
              Auction Ended
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

function ModernAuctionList({ username, isAdmin, onJoinAuction, onShowAdminDashboard, notifications }) {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'live', 'upcoming', 'ended'
  const { logout } = useAuth();

  useEffect(() => {
    fetchAuctions();
    const interval = setInterval(fetchAuctions, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAuctions = async () => {
    try {
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
    }
  };

  const filteredAuctions = auctions.filter(auction => {
    const isLive = auction.isActive && auction.remainingTime > 0;
    const isUpcoming = auction.startTime > Date.now();
    const isEnded = !auction.isActive || auction.remainingTime <= 0;

    switch (filter) {
      case 'live': return isLive;
      case 'upcoming': return isUpcoming;
      case 'ended': return isEnded;
      default: return true;
    }
  });

  const stats = {
    total: auctions.length,
    live: auctions.filter(a => a.isActive && a.remainingTime > 0).length,
    upcoming: auctions.filter(a => a.startTime > Date.now()).length,
    ended: auctions.filter(a => !a.isActive || a.remainingTime <= 0).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-8 text-center"
        >
          <div className="animate-spin w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading auctions...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="glass-dark border-b border-white/10 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Live Auctions
              </h1>
              <p className="text-gray-400 mt-1">Discover and bid on premium items</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Refresh Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchAuctions}
                className="glass rounded-xl p-3 hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </motion.button>

              {/* Admin Dashboard Button */}
              {isAdmin && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onShowAdminDashboard}
                  className="glass rounded-xl px-4 py-3 hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </motion.button>
              )}

              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{username}</div>
                  <div className="text-xs text-gray-400">{isAdmin ? 'Administrator' : 'Bidder'}</div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="glass rounded-xl px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
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
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          {[
            { label: 'Total', value: stats.total, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Live', value: stats.live, color: 'text-green-400', bg: 'bg-green-500/10' },
            { label: 'Upcoming', value: stats.upcoming, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: 'Ended', value: stats.ended, color: 'text-gray-400', bg: 'bg-gray-500/10' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass rounded-xl p-3 text-center ${stat.bg}`}
            >
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 mb-6 overflow-x-auto"
        >
          {[
            { key: 'all', label: 'All Auctions', icon: Filter },
            { key: 'live', label: 'Live Now', icon: Zap },
            { key: 'upcoming', label: 'Upcoming', icon: Calendar },
            { key: 'ended', label: 'Ended', icon: Trophy },
          ].map(({ key, label, icon: Icon }) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                filter === key
                  ? 'bg-purple-500 text-white'
                  : 'glass text-gray-300 hover:bg-white/10'
              }`}
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