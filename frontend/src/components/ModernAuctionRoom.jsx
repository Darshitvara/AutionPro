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

const CircularProgress = ({ progress, timeLeft, size = 120 }) => {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress * circumference);

  const getTimerColor = () => {
    if (timeLeft <= 10) return '#ef4444'; // red
    if (timeLeft <= 30) return '#f59e0b'; // yellow
    return '#8b5cf6'; // purple
  };

  const getTimerGradient = () => {
    if (timeLeft <= 10) return 'from-red-400 to-red-600';
    if (timeLeft <= 30) return 'from-yellow-400 to-orange-500';
    return 'from-purple-400 to-blue-500';
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
    <div className="relative flex flex-col items-center" style={{ width: size + 40, height: size + 60 }}>
      {/* Main Timer Circle */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Progress Circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getTimerColor()}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="timer-ring"
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeInOut" }}
            style={{
              filter: `drop-shadow(0 0 12px ${getTimerColor()}60)`,
            }}
          />
          {/* Inner glow effect */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius - 20}
            stroke={getTimerColor()}
            strokeWidth="1"
            fill="transparent"
            opacity="0.3"
          />
        </svg>
        
        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Timer Icon */}
          <motion.div
            animate={{ 
              scale: timeLeft <= 10 ? [1, 1.1, 1] : 1,
              rotate: timeLeft <= 10 ? [0, 5, -5, 0] : 0 
            }}
            transition={{ 
              duration: timeLeft <= 10 ? 0.5 : 0,
              repeat: timeLeft <= 10 ? Infinity : 0 
            }}
          >
            <Timer className="w-6 h-6 mb-2" style={{ color: getTimerColor() }} />
          </motion.div>
          
          {/* Time Display */}
          <div className="text-center">
            <div className={`text-2xl font-bold bg-gradient-to-r ${getTimerGradient()} bg-clip-text text-transparent mb-1`}>
              {time.minutes}:{time.seconds}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">
              {timeLeft <= 10 ? 'HURRY!' : timeLeft <= 30 ? 'ENDING SOON' : 'REMAINING'}
            </div>
          </div>
        </div>
        
        {/* Pulsing effect for urgent time */}
        {timeLeft <= 10 && (
          <motion.div
            className="absolute inset-0 border-2 border-red-500 rounded-full"
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>
      
      {/* Status Text Below */}
      <motion.div 
        className="mt-4 text-center"
        animate={{ 
          color: getTimerColor(),
        }}
      >
        <div className="text-sm font-semibold mb-1">
          {timeLeft <= 10 ? '🚨 Final Moments!' : 
           timeLeft <= 30 ? '⚡ Act Fast!' : 
           timeLeft <= 60 ? '⏰ Last Minute' : 
           '🔥 Auction Live'}
        </div>
        <div className="text-xs text-gray-500">
          {timeLeft > 60 ? `${Math.floor(timeLeft / 60)} minutes left` : 'Less than a minute'}
        </div>
      </motion.div>
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
      className={`max-w-xs px-4 py-3 rounded-2xl glass ${
        isOwn 
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
          : 'bg-gray-800 text-gray-100'
      }`}
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

function ModernAuctionRoom({ username, auctionState, notifications, participants, onPlaceBid, onBackToList }) {
  const { logout } = useAuth();
  const [bidAmount, setBidAmount] = useState('');
  const [showBidSuccess, setShowBidSuccess] = useState(false);

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="glass rounded-3xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-300">Loading auction...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Fixed Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBackToList}
                className="glass rounded-xl p-3 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <h1 className="font-display text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Live Auction
                </h1>
                <p className="text-gray-400 text-sm">Real-time bidding</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Timer Badge */}
              <div className="glass rounded-2xl px-4 py-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="font-mono text-sm">
                  {formatTime(auctionState.remainingTime)}
                </span>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="glass rounded-2xl px-4 py-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">{participants.length}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{username}</div>
                  <div className="text-xs text-gray-400">Bidder</div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="glass rounded-xl px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Logout
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="pt-24 md:pt-32 pb-8 px-4 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-4 gap-6 md:gap-8 mt-4">
          {/* Left Column - Product Showcase */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Enhanced Product Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl overflow-hidden relative"
            >
              {/* Live Badge */}
              {auctionState.isActive && (
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  LIVE
                </div>
              )}
              
              {/* Category Badge */}
              <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                {auctionState.product?.category || 'General'}
              </div>

              {/* Hero Image */}
              <div className="relative h-80 overflow-hidden">
                <img
                  src={auctionState.product?.image || 'https://via.placeholder.com/600x400?text=Auction+Item'}
                  alt={auctionState.product?.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                
                {/* Quick Stats Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div className="glass-light rounded-xl p-3">
                    <div className="text-xs text-gray-300 mb-1">Starting Price</div>
                    <div className="text-lg font-bold text-white">₹{auctionState.startingPrice?.toLocaleString()}</div>
                  </div>
                  <div className="glass-light rounded-xl p-3">
                    <div className="text-xs text-gray-300 mb-1">Total Bids</div>
                    <div className="text-lg font-bold text-white">{auctionState.bidHistory?.length || 0}</div>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-6">
                <div className="mb-6">
                  <h1 className="font-display text-3xl font-bold text-white mb-3 leading-tight">
                    {auctionState.product?.name || auctionState.productName}
                  </h1>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    {auctionState.product?.description || 'Premium auction item with excellent quality and condition.'}
                  </p>
                </div>

                {/* Current Bid Showcase */}
                <div className="glass-dark rounded-2xl p-6 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10"></div>
                  <div className="relative z-10">
                    <div className="text-sm text-gray-400 mb-2 uppercase tracking-wide">Current Highest Bid</div>
                    <motion.div
                      key={auctionState.currentPrice}
                      initial={{ scale: 1.1, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, type: "spring" }}
                      className="font-display text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-2"
                    >
                      ₹{auctionState.currentPrice.toLocaleString()}
                    </motion.div>
                    {auctionState.highestBidder && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <span className="text-yellow-500 font-semibold text-lg">
                          {auctionState.highestBidder}
                        </span>
                        <span className="text-gray-400">leading</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Center Column - Bidding Interface */}
          <div className="space-y-6 md:space-y-8">
            {/* Enhanced Timer */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-3xl p-8 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-purple-500/5"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="text-sm text-gray-400 mb-6 uppercase tracking-wide font-medium">Time Remaining</div>
                <CircularProgress 
                  progress={progress} 
                  timeLeft={auctionState.remainingTime} 
                  size={120}
                />
              </div>
            </motion.div>

            {/* Enhanced Bid Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-500/10 to-transparent rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <h3 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-500" />
                  Place Your Bid
                </h3>
                
                {auctionState.isActive ? (
                  <div className="space-y-4">
                    {/* Bid Amount Input */}
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">₹</div>
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={(auctionState.currentPrice + 1000).toLocaleString()}
                        className="w-full bg-gray-800/50 border-2 border-gray-600 rounded-xl pl-8 pr-4 py-4 text-xl font-bold text-white placeholder-gray-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                        min={auctionState.currentPrice + 1}
                      />
                    </div>
                    
                    {/* Quick Bid Buttons */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[1000, 5000].map((increment) => (
                        <button
                          key={increment}
                          onClick={() => setBidAmount((auctionState.currentPrice + increment).toString())}
                          className="glass-light rounded-lg py-2 px-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all"
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
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-6 rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-green-500/25 transition-all"
                    >
                      <TrendingUp className="w-5 h-5" />
                      Place Bid
                    </motion.button>
                    
                    <div className="text-xs text-gray-400 text-center mt-2">
                      Minimum bid: ₹{(auctionState.currentPrice + 1).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-2xl font-bold text-yellow-500 mb-2">Auction Ended!</h3>
                    {auctionState.highestBidder && (
                      <div>
                        <p className="text-gray-300 mb-2">🎉 Congratulations to the winner!</p>
                        <div className="glass rounded-xl p-4">
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
          <div className="space-y-6 md:space-y-8">
            {/* Live Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-4 max-h-96 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  Live Activity
                </h3>
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Users className="w-4 h-4" />
                  {participants.length}
                </div>
              </div>
              
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <AnimatePresence>
                  {auctionState.bidHistory?.slice(-10).reverse().map((bid, index) => (
                    <motion.div
                      key={`${bid.timestamp}-${index}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-xl border ${
                        bid.username === username 
                          ? 'bg-purple-500/10 border-purple-500/30' 
                          : 'bg-gray-800/30 border-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium text-sm ${
                          bid.username === username ? 'text-purple-400' : 'text-gray-300'
                        }`}>
                          {bid.username === username ? 'You' : bid.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(bid.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="font-bold text-white">₹{bid.amount.toLocaleString()}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {(!auctionState.bidHistory || auctionState.bidHistory.length === 0) && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-3">🎯</div>
                    <p className="text-sm">No bids yet</p>
                    <p className="text-xs text-gray-500">Be the first to bid!</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Auction Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass rounded-2xl p-4"
            >
              <h3 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wide">Auction Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Duration</span>
                  <span className="text-white font-medium">{auctionState.durationMinutes} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Total Bids</span>
                  <span className="text-white font-medium">{auctionState.bidHistory?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Participants</span>
                  <span className="text-white font-medium">{participants.length}</span>
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