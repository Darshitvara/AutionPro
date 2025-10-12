import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  TrendingUp, 
  Users, 
  Zap, 
  ArrowLeft, 
  Trophy,
  DollarSign,
  Timer,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CircularProgress = ({ progress, timeLeft, size = 90 }) => {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress * circumference);

  const getTimerColor = () => {
    if (timeLeft <= 10) return '#FF4C29'; // red
    if (timeLeft <= 30) return '#FFD700'; // gold
    return '#FFD700'; // gold default
  };

  const getTimerGradient = () => {
    if (timeLeft <= 10) return 'from-red-400 to-red-600';
    if (timeLeft <= 30) return 'from-yellow-400 to-orange-500';
    return 'from-yellow-400 to-yellow-500';
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return {
      minutes: minutes.toString().padStart(2, '0'),
      seconds: remainingSeconds.toString().padStart(2, '0')
    };
  };

  const time = formatTime(timeLeft);

  return (
    <div className="relative flex flex-col items-center" style={{ width: size + 20, height: size + 30 }}>
      {/* Compact Timer Circle */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="6"
            fill="transparent"
          />
          
          {/* Progress Circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getTimerColor()}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeInOut" }}
            style={{
              filter: `drop-shadow(0 0 6px ${getTimerColor()}60)`,
            }}
          />
        </svg>
        
        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Timer Icon */}
          <motion.div
            animate={{ 
              scale: timeLeft <= 10 ? [1, 1.1, 1] : 1,
            }}
            transition={{ 
              duration: timeLeft <= 10 ? 0.8 : 0,
              repeat: timeLeft <= 10 ? Infinity : 0 
            }}
            className="mb-1"
          >
            <Timer className="w-4 h-4" style={{ color: getTimerColor() }} />
          </motion.div>
          
          {/* Compact Time Display */}
          <div className="text-center">
            <div className={`text-base font-bold bg-gradient-to-r ${getTimerGradient()} bg-clip-text text-transparent`}>
              {time.minutes}:{time.seconds}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wide font-medium -mt-0.5">
              {timeLeft <= 10 ? 'FINAL' : timeLeft <= 30 ? 'ENDING' : 'LEFT'}
            </div>
          </div>
        </div>
        
        {/* Simple urgent effect */}
        {timeLeft <= 10 && (
          <motion.div
            className="absolute inset-0 border border-red-500/40 rounded-full"
            animate={{ 
              scale: [1, 1.03, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>
      
      {/* Compact Status Text */}
      <div className="mt-1 text-center">
        <div className="text-xs font-medium" style={{ color: getTimerColor() }}>
          {timeLeft <= 10 ? '🚨 Final' : 
           timeLeft <= 30 ? '⚡ Soon' : 
           timeLeft <= 60 ? '⏰ Last' : 
           '🔥 Live'}
        </div>
      </div>
    </div>
  );
};

const BidBubble = ({ bid, isOwn, index }) => (
  <motion.div
    initial={{ opacity: 0, x: isOwn ? 20 : -20, scale: 0.8 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    transition={{ delay: index * 0.1 }}
    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
  >
    <div
      className={`max-w-xs px-4 py-3 rounded-2xl ${
        isOwn 
          ? 'text-black font-medium' 
          : 'text-gray-100'
      }`}
      style={isOwn ? {
        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        border: '1px solid rgba(255,215,0,0.5)'
      } : {
        background: 'rgba(0,0,0,0.8)',
        border: '1px solid rgba(255,215,0,0.2)'
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-sm">{bid.username}</span>
        <DollarSign className="w-3 h-3" />
      </div>
      <div className="text-lg font-bold">₹{bid.amount.toLocaleString()}</div>
      <div className="text-xs opacity-75">
        {new Date(bid.timestamp).toLocaleTimeString()}
      </div>
    </div>
  </motion.div>
);

function ModernAuctionRoom({ username, auctionState, notifications, participants, onPlaceBid, onBackToList, isPreviewMode = false, isHistoryMode = false }) {
  const { logout } = useAuth();
  const [bidAmount, setBidAmount] = useState('');
  const [showBidSuccess, setShowBidSuccess] = useState(false);

  // Determine auction status for display
  const isLive = auctionState?.status === 'live' && auctionState?.remainingTime > 0 && !isPreviewMode && !isHistoryMode;
  const isEnded = auctionState?.status === 'closed' || auctionState?.status === 'cancelled' || isHistoryMode;
  const isUpcoming = auctionState?.status === 'upcoming' || isPreviewMode;

  // Control body overflow for preview/history mode
  useEffect(() => {
    if (isPreviewMode || isHistoryMode) {
      document.body.classList.add('preview-mode');
    } else {
      document.body.classList.remove('preview-mode');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('preview-mode');
    };
  }, [isPreviewMode, isHistoryMode]);

  const handlePlaceBid = () => {
    const amount = parseInt(bidAmount);
    if (amount && amount > auctionState.currentPrice) {
      onPlaceBid(amount);
      setBidAmount('');
      setShowBidSuccess(true);
      setTimeout(() => setShowBidSuccess(false), 2000);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = auctionState?.remainingTime 
    ? Math.max(0, (auctionState.remainingTime / (auctionState.durationMinutes * 60)))
    : 0;

  if (!auctionState) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0A0A0A, #1a1a1a, #0A0A0A)' }}>
        <div 
          className="rounded-3xl p-8 text-center"
          style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,215,0,0.2)' }}
        >
          <div className="animate-spin w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p style={{ color: '#E5E5E5' }}>Loading auction...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isPreviewMode || isHistoryMode ? 'h-screen overflow-hidden flex flex-col' : 'min-h-screen'}`} style={{ background: 'linear-gradient(135deg, #0A0A0A, #1a1a1a, #0A0A0A)' }}>
      {/* Fixed Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50"
        style={{ background: 'rgba(0,0,0,0.95)', borderBottom: '1px solid rgba(255,215,0,0.2)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBackToList}
                className="rounded-xl p-3 transition-colors"
                style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,215,0,0.3)' }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,215,0,0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.6)'}
              >
                <ArrowLeft className="w-5 h-5" style={{ color: '#C0C0C0' }} />
              </motion.button>
              <div>
                <h1 className="font-display text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                  {isHistoryMode ? 'Auction Results' : isPreviewMode ? 'Auction Preview' : 'Live Auction'}
                </h1>
                <p className="text-sm" style={{ color: '#C0C0C0' }}>
                  {isHistoryMode ? 'View complete auction history' : isPreviewMode ? 'Preview mode' : 'Real-time bidding'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Timer Badge - Only show for live auctions */}
              {isLive && (
                <div 
                  className="rounded-xl px-4 py-2 flex items-center gap-2"
                  style={{ 
                    background: 'rgba(0,0,0,0.7)', 
                    border: '1px solid rgba(255,215,0,0.4)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Clock className="w-4 h-4" style={{ color: '#FFD700' }} />
                  <span className="font-mono text-sm font-medium text-yellow-400">
                    {formatTime(auctionState.remainingTime)}
                  </span>
                </div>
              )}

              {/* Status Badge for non-live auctions */}
              {!isLive && (
                <div 
                  className="rounded-xl px-4 py-2 flex items-center gap-2"
                  style={{ 
                    background: isEnded ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)', 
                    border: `1px solid ${isEnded ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'}`,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <span className="text-sm font-medium" style={{ 
                    color: isEnded ? '#F87171' : '#60A5FA' 
                  }}>
                    {isEnded ? 'ENDED' : isPreviewMode ? 'PREVIEW' : 'UPCOMING'}
                  </span>
                </div>
              )}

              {/* User Info */}
              <div className="flex items-center gap-3">
                <div 
                  className="rounded-2xl px-4 py-2 flex items-center gap-2"
                  style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,215,0,0.3)' }}
                >
                  <Users className="w-4 h-4" style={{ color: '#FFD700' }} />
                  <span className="text-sm text-white">
                    {isPreviewMode || isHistoryMode ? auctionState.participantCount || 0 : participants.length}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{username}</div>
                  <div className="text-xs" style={{ color: '#C0C0C0' }}>
                    {isHistoryMode ? 'Viewer' : 'Bidder'}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="rounded-xl px-4 py-2 text-red-400 transition-colors"
                  style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(239,68,68,0.3)' }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(239,68,68,0.1)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.6)'}
                >
                  Logout
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className={`pt-20 md:pt-24 mt-5 pb-6 px-4 max-w-7xl mx-auto ${isPreviewMode || isHistoryMode ? 'flex-1 overflow-hidden' : 'min-h-screen'}`}>
        {/* Winner Announcement for Ended Auctions */}
        {isEnded && auctionState.winnerUsername && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-3xl p-6 text-center relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,165,0,0.1), rgba(255,215,0,0.1))', 
              border: '1px solid rgba(255,215,0,0.3)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-yellow-500/5"></div>
            <div className="relative z-10">
              <div className="text-4xl mb-3">🏆</div>
              <h2 className="font-display text-2xl font-bold text-yellow-400 mb-2">
                Auction Winner
              </h2>
              <p className="text-white text-lg mb-1">
                <span className="font-semibold">{auctionState.winnerUsername}</span>
              </p>
              <p className="text-gray-300 text-sm mb-4">
                Won with a bid of <span className="font-bold text-yellow-400">₹{auctionState.finalPrice?.toLocaleString()}</span>
              </p>
              <div className="flex justify-center gap-6 text-sm">
                <div>
                  <span className="text-gray-400">Total Bids: </span>
                  <span className="text-white font-medium">{auctionState.bidHistory?.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-400">Participants: </span>
                  <span className="text-white font-medium">{auctionState.participantCount || 0}</span>
                </div>
                {auctionState.actualEndTime && (
                  <div>
                    <span className="text-gray-400">Ended: </span>
                    <span className="text-white font-medium">
                      {new Date(auctionState.actualEndTime).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* No Winner Message for Ended Auctions */}
        {isEnded && !auctionState.winnerUsername && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-3xl p-6 text-center relative overflow-hidden"
            style={{ 
              background: 'rgba(107,114,128,0.1)', 
              border: '1px solid rgba(107,114,128,0.3)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <div className="text-4xl mb-3">📝</div>
            <h2 className="font-display text-xl font-bold text-gray-400 mb-2">
              Auction Ended
            </h2>
            <p className="text-gray-300">
              No bids were placed for this auction
            </p>
            {auctionState.actualEndTime && (
              <p className="text-sm text-gray-400 mt-2">
                Ended on {new Date(auctionState.actualEndTime).toLocaleDateString()}
              </p>
            )}
          </motion.div>
        )}

        <div className={`${isPreviewMode || isHistoryMode ? 'flex flex-col lg:flex-row gap-4 md:gap-6 h-full overflow-hidden' : 'grid lg:grid-cols-4 gap-4 md:gap-6 h-full'}`}>
          {/* Left Column - Product Showcase */}
          <div className={`${isPreviewMode || isHistoryMode ? 'flex-1 lg:flex-[2] min-h-0 overflow-hidden' : 'lg:col-span-2'} space-y-4 md:space-y-6`}>
            {/* Enhanced Product Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl overflow-hidden relative ${isPreviewMode || isHistoryMode ? 'h-full flex flex-col' : 'h-full flex flex-col'}`}
              style={{ 
                background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(39,39,42,0.6), rgba(0,0,0,0.8))', 
                backdropFilter: 'blur(20px)', 
                border: '1px solid rgba(255,215,0,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
            >
              {/* Status Badge */}
              {isLive && (
                <div 
                  className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                  style={{ background: 'rgba(255,76,41,0.9)', color: 'white' }}
                >
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  LIVE
                </div>
              )}

              {isEnded && (
                <div 
                  className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                  style={{ background: 'rgba(239,68,68,0.9)', color: 'white' }}
                >
                  {auctionState.winnerUsername ? '🏆 SOLD' : '📝 ENDED'}
                </div>
              )}

              {isPreviewMode && (
                <div 
                  className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                  style={{ background: 'rgba(59,130,246,0.9)', color: 'white' }}
                >
                  👁️ PREVIEW
                </div>
              )}
              
              {/* Category Badge */}
              <div 
                className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full text-sm"
                style={{ background: 'rgba(0,0,0,0.7)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)' }}
              >
                {auctionState.product?.category || 'General'}
              </div>

              {/* Hero Image */}
              <div className={`relative ${isPreviewMode || isHistoryMode ? 'h-56' : 'h-64'} overflow-hidden flex-shrink-0`}>
                <img
                  src={auctionState.product?.image || 'https://via.placeholder.com/600x400?text=Auction+Item'}
                  alt={auctionState.product?.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                
                {/* Quick Stats Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div 
                    className="rounded-xl p-3"
                    style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,215,0,0.3)' }}
                  >
                    <div className="text-xs mb-1" style={{ color: '#C0C0C0' }}>
                      {isEnded ? 'Final Price' : 'Starting Price'}
                    </div>
                    <div className="text-lg font-bold text-white">
                      ₹{(isEnded ? auctionState.finalPrice || auctionState.currentPrice : auctionState.startingPrice)?.toLocaleString()}
                    </div>
                  </div>
                  <div 
                    className="rounded-xl p-3"
                    style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,215,0,0.3)' }}
                  >
                    <div className="text-xs mb-1" style={{ color: '#C0C0C0' }}>Total Bids</div>
                    <div className="text-lg font-bold text-white">{auctionState.bidHistory?.length || 0}</div>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-6 flex-1 flex flex-col min-h-0">
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center gap-3 mb-3 flex-shrink-0">
                    <h1 className="font-display text-3xl font-bold text-white leading-tight">
                      {auctionState.product?.name || auctionState.productName}
                    </h1>
                    {isPreviewMode && (
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
                        PREVIEW
                      </span>
                    )}
                    {isHistoryMode && (
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-600/20 text-gray-400 border border-gray-500/30">
                        HISTORY
                      </span>
                    )}
                  </div>
                  {/* Scrollable Description Container */}
                  <div className="flex-1 min-h-0 mb-6">
                    <div className="h-full overflow-y-auto product-description-scroll pr-2">
                      <p style={{ color: '#C0C0C0' }} className="leading-relaxed text-lg">
                        {auctionState.product?.description || 'Premium auction item with excellent quality and condition. This item has been carefully selected for its exceptional quality and rarity. It represents excellent value for collectors and enthusiasts alike. The item comes with full documentation and authenticity guarantees. Perfect for both investment and personal enjoyment. Don\'t miss this opportunity to own a piece of excellence.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Bid Showcase */}
                <div 
                  className={`rounded-2xl ${isPreviewMode || isHistoryMode ? 'p-4' : 'p-5'} text-center relative overflow-hidden flex-shrink-0`}
                  style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,215,0,0.2)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10"></div>
                  <div className="relative z-10">
                    <div className={`${isPreviewMode || isHistoryMode ? 'text-xs mb-1' : 'text-sm mb-2'} uppercase tracking-wide`} style={{ color: '#C0C0C0' }}>
                      {isEnded ? 'Final Winning Bid' : isPreviewMode ? 'Starting Price' : 'Current Highest Bid'}
                    </div>
                    <motion.div
                      key={isEnded ? auctionState.finalPrice : auctionState.currentPrice}
                      initial={{ scale: 1.1, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, type: "spring" }}
                      className={`font-display ${isPreviewMode || isHistoryMode ? 'text-3xl' : 'text-4xl'} font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent ${isPreviewMode || isHistoryMode ? 'mb-1' : 'mb-2'}`}
                    >
                      ₹{(() => {
                        if (isEnded) return (auctionState.finalPrice || auctionState.currentPrice)?.toLocaleString();
                        if (isPreviewMode) return auctionState.startingPrice?.toLocaleString();
                        return auctionState.currentPrice?.toLocaleString();
                      })()}
                    </motion.div>
                    {auctionState.highestBidder && !isPreviewMode && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <Trophy className={`${isPreviewMode || isHistoryMode ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-500`} />
                        <span className={`text-yellow-500 font-semibold ${isPreviewMode || isHistoryMode ? 'text-base' : 'text-lg'}`}>
                          {isEnded ? auctionState.winnerUsername || auctionState.highestBidder : auctionState.highestBidder}
                        </span>
                        <span style={{ color: '#C0C0C0' }}>
                          {isEnded ? 'winner' : 'leading'}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Center Column - Bidding Interface */}
          <div className={`space-y-4 md:space-y-5 ${isPreviewMode ? 'flex-1 min-h-0 flex flex-col' : 'h-full flex flex-col'}`}>
            {/* Simplified Timer */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl ${isPreviewMode ? 'p-4' : 'p-6'} text-center relative overflow-hidden flex-shrink-0`}
              style={{ 
                background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(26,26,26,0.6), rgba(0,0,0,0.8))', 
                backdropFilter: 'blur(20px)', 
                border: '1px solid rgba(255,215,0,0.3)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="text-sm mb-4 uppercase tracking-wide font-semibold text-white">
                  {isPreviewMode ? 'Preview Mode' : 'Time Remaining'}
                </div>
                
                {isPreviewMode ? (
                  <div className="flex flex-col items-center">
                    <div className={`${isPreviewMode ? 'w-16 h-16' : 'w-20 h-20'} flex items-center justify-center rounded-full mb-2`} style={{ background: 'rgba(59,130,246,0.2)', border: '2px solid rgba(59,130,246,0.4)' }}>
                      <div className={`${isPreviewMode ? 'text-2xl' : 'text-3xl'}`}>⏸️</div>
                    </div>
                    <div className="text-blue-400 text-sm font-medium">Auction Pending</div>
                    <div className="text-xs text-gray-400 mt-1">Time Frozen</div>
                  </div>
                ) : (
                  <CircularProgress 
                    progress={progress} 
                    timeLeft={auctionState.remainingTime} 
                    size={90}
                  />
                )}
              </div>
            </motion.div>

            {/* Enhanced Bid Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-2xl ${isPreviewMode ? 'p-4' : 'p-5'} relative overflow-hidden flex-1 min-h-0 flex flex-col`}
              style={{ 
                background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(39,39,42,0.6), rgba(0,0,0,0.8))', 
                backdropFilter: 'blur(20px)', 
                border: '1px solid rgba(255,215,0,0.2)'
              }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-full blur-xl"></div>
              
              <div className="relative z-10">
                <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2 text-white">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  {isPreviewMode ? 'Preview Mode' : 'Place Your Bid'}
                </h3>
                
                {isPreviewMode ? (
                  <div className={`text-center ${isPreviewMode ? 'py-4' : 'py-8'}`}>
                    <div className={`${isPreviewMode ? 'text-4xl mb-2' : 'text-6xl mb-4'}`}>👁️</div>
                    <h3 className={`${isPreviewMode ? 'text-lg' : 'text-xl'} font-bold text-blue-400 ${isPreviewMode ? 'mb-2' : 'mb-3'}`}>Auction Preview</h3>
                    <div className="space-y-3">
                      <div 
                        className="rounded-xl p-4"
                        style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(59,130,246,0.3)' }}
                      >
                        <div className="text-blue-400 font-medium text-sm mb-1">Starting Price</div>
                        <div className="text-2xl font-bold text-white">₹{auctionState.currentPrice?.toLocaleString() || 'TBD'}</div>
                      </div>
                      <div 
                        className="rounded-xl p-3"
                        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
                      >
                        <p className="text-blue-300 text-sm">
                          🔒 Bidding will be enabled when the auction goes live
                        </p>
                      </div>
                      <div 
                        className="rounded-xl p-3"
                        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,215,0,0.2)' }}
                      >
                        <p className="text-yellow-400 text-sm">
                          ⏰ Starts: {auctionState.scheduledStartTime ? new Date(auctionState.scheduledStartTime).toLocaleString() : 'TBD'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : auctionState.status === 'live' ? (
                  <div className="space-y-3">
                    {/* Bid Amount Input */}
                    <div className="relative">
                      <div 
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 font-semibold"
                        style={{ color: '#FFD700' }}
                      >₹</div>
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={(auctionState.currentPrice + 1000).toLocaleString()}
                        className="w-full pl-7 pr-3 py-3 text-lg font-bold text-white rounded-xl transition-all"
                        style={{ 
                          background: 'rgba(0,0,0,0.6)', 
                          border: '2px solid rgba(255,215,0,0.3)',
                          color: '#FFFFFF'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'rgba(255,215,0,0.6)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,215,0,0.3)'}
                        min={auctionState.currentPrice + 1}
                      />
                    </div>
                    
                    {/* Quick Bid Buttons */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[1000, 5000].map((increment) => (
                        <button
                          key={increment}
                          onClick={() => setBidAmount((auctionState.currentPrice + increment).toString())}
                          className="rounded-lg py-2 px-3 text-sm transition-all"
                          style={{ 
                            background: 'rgba(0,0,0,0.6)', 
                            border: '1px solid rgba(255,215,0,0.3)',
                            color: '#C0C0C0'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255,215,0,0.1)';
                            e.target.style.color = '#FFFFFF';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(0,0,0,0.6)';
                            e.target.style.color = '#C0C0C0';
                          }}
                        >
                          +₹{increment.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    
                    {/* Bid Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePlaceBid}
                      disabled={!bidAmount || parseInt(bidAmount) <= auctionState.currentPrice}
                      className="w-full text-black font-bold py-3 px-4 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                      style={{ 
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                        boxShadow: '0 4px 20px rgba(255,215,0,0.3)'
                      }}
                      onMouseEnter={(e) => {
                        if (!e.target.disabled) {
                          e.target.style.boxShadow = '0 6px 25px rgba(255,215,0,0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.boxShadow = '0 4px 20px rgba(255,215,0,0.3)';
                      }}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Place Bid
                    </motion.button>
                    
                    <div className="text-xs text-center mt-2" style={{ color: '#C0C0C0' }}>
                      Min: ₹{(auctionState.currentPrice + 1).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-2xl font-bold text-yellow-500 mb-2">Auction Ended!</h3>
                    {auctionState.highestBidder && (
                      <div>
                        <p className="mb-2" style={{ color: '#C0C0C0' }}>🎉 Congratulations to the winner!</p>
                        <div 
                          className="rounded-xl p-4"
                          style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,215,0,0.3)' }}
                        >
                          <div className="text-yellow-500 font-bold text-lg">{auctionState.highestBidder}</div>
                          <div className="text-2xl font-bold text-white">₹{auctionState.currentPrice.toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Activity & Participants */}
          <div className={`${isPreviewMode ? 'flex-1 min-h-0 overflow-hidden flex flex-col' : ''} space-y-4 md:space-y-5`}>
            {/* Live Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`rounded-2xl p-4 ${isPreviewMode ? 'flex-1 min-h-0 overflow-hidden' : 'max-h-96 overflow-hidden'}`}
              style={{ 
                background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(39,39,42,0.6), rgba(0,0,0,0.8))', 
                backdropFilter: 'blur(20px)', 
                border: '1px solid rgba(255,215,0,0.2)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2 text-white">
                  <Activity className="w-5 h-5 text-yellow-500" />
                  Live Activity
                </h3>
                <div className="flex items-center gap-1 text-sm" style={{ color: '#C0C0C0' }}>
                  <Users className="w-4 h-4" />
                  {isPreviewMode ? 0 : participants.length}
                </div>
              </div>
              
              <div className={`space-y-2 pr-2 ${isPreviewMode ? 'overflow-hidden flex-1 min-h-0' : 'max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent'}`}>
                <AnimatePresence>
                  {isPreviewMode ? (
                    <div className="text-center py-12" style={{ color: '#6B7280' }}>
                      <div className="text-4xl mb-3">👁️‍🗨️</div>
                      <p className="text-blue-400 font-medium mb-2">Preview Mode Active</p>
                      <p className="text-sm text-gray-400">Live bidding activity will appear here when the auction starts</p>
                    </div>
                  ) : (
                    <>
                      {auctionState.bidHistory?.slice(-10).reverse().map((bid, index) => (
                    <motion.div
                      key={`${bid.timestamp}-${index}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-xl ${
                        bid.username === username 
                          ? 'border border-yellow-500/30' 
                          : 'border border-gray-700/50'
                      }`}
                      style={bid.username === username ? {
                        background: 'rgba(255,215,0,0.1)'
                      } : {
                        background: 'rgba(0,0,0,0.3)'
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium text-sm ${
                          bid.username === username ? 'text-yellow-400' : 'text-gray-300'
                        }`}>
                          {bid.username === username ? 'You' : bid.username}
                        </span>
                        <span className="text-xs" style={{ color: '#C0C0C0' }}>
                          {new Date(bid.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="font-bold text-white">₹{bid.amount.toLocaleString()}</div>
                    </motion.div>
                  ))}
                      
                      {(!auctionState.bidHistory || auctionState.bidHistory.length === 0) && (
                        <div className="text-center py-12" style={{ color: '#C0C0C0' }}>
                          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No bids yet. Be the first!</p>
                        </div>
                      )}
                    </>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Auction Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`rounded-2xl ${isPreviewMode ? 'p-3' : 'p-4'}`}
              style={{ 
                background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(39,39,42,0.6), rgba(0,0,0,0.8))', 
                backdropFilter: 'blur(20px)', 
                border: '1px solid rgba(255,215,0,0.2)'
              }}
            >
              <h3 className={`font-semibold text-sm uppercase tracking-wide text-white ${isPreviewMode ? 'mb-2' : 'mb-4'}`}>Auction Stats</h3>
              <div className={`${isPreviewMode ? 'space-y-2' : 'space-y-3'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#C0C0C0' }}>Duration</span>
                  <span className="text-white font-medium">{auctionState.durationMinutes} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#C0C0C0' }}>Total Bids</span>
                  <span className="text-white font-medium">{auctionState.bidHistory?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#C0C0C0' }}>Participants</span>
                  <span className="text-white font-medium">{isPreviewMode ? 0 : participants.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Price Increase</span>
                  <span className="text-green-400 font-medium">
                    +₹{((auctionState.currentPrice - auctionState.startingPrice) || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bid Success Animation */}
      <AnimatePresence>
        {showBidSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-green-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-2xl">
              ✨ Bid Placed Successfully!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ModernAuctionRoom;