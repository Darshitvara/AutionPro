import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Zap, 
  Bell, 
  Shield, 
  Smartphone, 
  ArrowRight, 
  ChevronRight,
  Star,
  Users,
  Trophy,
  Timer,
  TrendingUp,
  User,
  Quote
} from 'lucide-react';

// Move components outside to prevent recreation
const FloatingCard = React.memo(({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay, ease: [0.6, -0.05, 0.01, 0.99] }}
    className="relative group"
  >
    <motion.div
      animate={{ y: [-6, 6, -6] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="relative backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/[0.02] border border-white/20 rounded-2xl p-6 shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group-hover:border-blue-400/30"
    >
      {/* Premium glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/5 via-purple-500/5 to-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  </motion.div>
));

// Optimized ParticleBackground with pre-calculated positions
const ParticleBackground = React.memo(() => {
  const [screenDimensions, setScreenDimensions] = useState({
    width: 1920,
    height: 1080
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (typeof window !== 'undefined') {
        setScreenDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const particles = useMemo(() => {
    return [...Array(30)].map((_, i) => ({
      id: i,
      initialX: Math.random() * screenDimensions.width,
      initialY: Math.random() * screenDimensions.height,
      targetX: Math.random() * screenDimensions.width,
      targetY: Math.random() * screenDimensions.height,
      duration: Math.random() * 15 + 10,
    }));
  }, [screenDimensions]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1.5 h-1.5 rounded-full opacity-40"
          style={{
            background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4)',
            filter: 'blur(0.5px)',
            boxShadow: '0 0 6px rgba(59, 130, 246, 0.5)'
          }}
          initial={{
            x: particle.initialX,
            y: particle.initialY,
          }}
          animate={{
            x: particle.targetX,
            y: particle.targetY,
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
          }}
        />
      ))}
      
      {/* Additional ambient light effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-cyan-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
    </div>
  );
});

// Static data moved outside component to prevent recreation
const FEATURES_DATA = [
  {
    icon: Zap,
    title: "Real-time Bidding",
    description: "Lightning-fast bid processing with instant updates and zero delays.",
    gradient: "from-yellow-400 to-orange-500"
  },
  {
    icon: Bell,
    title: "Instant Notifications",
    description: "Stay ahead with real-time alerts for outbids and auction updates.",
    gradient: "from-blue-400 to-purple-500"
  },
  {
    icon: Shield,
    title: "Secure & Fair",
    description: "Bank-grade security with transparent and verifiable auction processes.",
    gradient: "from-green-400 to-teal-500"
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description: "Optimized for all devices with native mobile app experience.",
    gradient: "from-purple-400 to-pink-500"
  }
];

const HOW_IT_WORKS_DATA = [
  {
    step: "01",
    title: "Sign Up",
    description: "Create your account in seconds with email verification.",
    icon: User
  },
  {
    step: "02", 
    title: "Join Auction",
    description: "Browse live auctions and find items you love.",
    icon: Timer
  },
  {
    step: "03",
    title: "Place Your Bids",
    description: "Bid confidently with real-time updates and notifications.",
    icon: TrendingUp
  },
  {
    step: "04",
    title: "Win Big",
    description: "Celebrate your wins and receive your items securely.",
    icon: Trophy
  }
];

const TESTIMONIALS_DATA = [
  {
    name: "Sarah Johnson",
    role: "Art Collector",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    quote: "I won my first auction in seconds! The real-time bidding is incredibly smooth and exciting."
  },
  {
    name: "Michael Chen",
    role: "Watch Enthusiast", 
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    quote: "The mobile experience is fantastic. I can bid from anywhere and never miss an opportunity."
  },
  {
    name: "Emma Davis",
    role: "Vintage Seller",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    quote: "As a seller, I love the transparent process and the high engagement from bidders."
  }
];

const LandingPage = ({ onNavigateToLogin, onNavigateToRegister }) => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, 100]);
  
  const [currentBid, setCurrentBid] = useState(2450);
  const [timeLeft, setTimeLeft] = useState(3547);

  // Optimized counter with useCallback
  const updateCounters = useCallback(() => {
    setCurrentBid(prev => prev + Math.floor(Math.random() * 50));
    setTimeLeft(prev => Math.max(0, prev - 1));
  }, []);

  // Animated counter for hero stats
  useEffect(() => {
    const interval = setInterval(updateCounters, 3000); // Increased interval
    return () => clearInterval(interval);
  }, [updateCounters]);

  // Memoized formatted values to prevent unnecessary re-renders
  const formattedBid = useMemo(() => currentBid.toLocaleString(), [currentBid]);
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = (timeLeft % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [timeLeft]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden relative">
      {/* Premium background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px] opacity-20" />
      
      {/* Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
        className="fixed top-0 w-full z-50 backdrop-blur-2xl bg-slate-950/80 border-b border-white/10 shadow-lg shadow-black/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex justify-between items-center">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent tracking-tight"
          >
            AuctionPro
          </motion.div>
          <div className="flex gap-2 sm:gap-3 lg:gap-4">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={onNavigateToLogin}
              className="px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base text-gray-300 hover:text-white font-medium transition-all duration-300 rounded-xl hover:bg-white/5"
            >
              Login
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={onNavigateToRegister}
              className="px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-500 hover:via-purple-500 hover:to-cyan-500 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              Sign Up
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-12">
        <ParticleBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.6, -0.05, 0.01, 0.99] }}
            className="text-center lg:text-left space-y-6"
          >
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.6, -0.05, 0.01, 0.99] }}
            >
              <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
                Bid Smarter.
              </span>
              <br />
              <span className="text-white drop-shadow-lg">Win Faster.</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-blue-400 bg-clip-text text-transparent drop-shadow-sm">
                Join Live Auctions Now.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.6, -0.05, 0.01, 0.99] }}
              className="text-lg lg:text-xl text-gray-300 leading-relaxed max-w-2xl"
            >
              Experience the thrill of real-time bidding with instant notifications, 
              secure transactions, and a seamless mobile experience.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={onNavigateToRegister}
                className="group px-8 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-500 hover:via-purple-500 hover:to-cyan-500 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                Join Auction
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="px-8 py-3 border-2 border-white/20 hover:border-white/40 rounded-xl font-semibold text-lg hover:bg-white/5 transition-all duration-300 backdrop-blur-sm"
              >
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
              className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-white/10"
            >
              <div className="text-center lg:text-left group">
                <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">50K+</div>
                <div className="text-gray-400 font-medium text-sm">Active Users</div>
              </div>
              <div className="text-center lg:text-left group">
                <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">1M+</div>
                <div className="text-gray-400 font-medium text-sm">Auctions Won</div>
              </div>
              <div className="text-center lg:text-left group">
                <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">99.9%</div>
                <div className="text-gray-400 font-medium text-sm">Uptime</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Floating Auction Card */}
          <motion.div
            style={{ y: y1 }}
            className="relative lg:block hidden"
          >
            <FloatingCard delay={1.2}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">Vintage Watch Collection</h3>
                    <p className="text-gray-400 text-sm">Premium Rolex Submariner</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Current Bid</p>
                    <p className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${formattedBid}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Time Left</p>
                    <p className="text-lg font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">{formattedTime}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">23 bidders</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg text-sm font-semibold transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
                  >
                    Place Bid
                  </motion.button>
                </div>
              </div>
            </FloatingCard>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Why Choose AuctionPro?
              </span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Built for speed, security, and seamless bidding experiences across all devices.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {FEATURES_DATA.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <div className="relative backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/[0.02] border border-white/20 rounded-2xl p-6 h-full hover:bg-white/10 transition-all duration-500 group-hover:border-white/30 shadow-xl hover:shadow-2xl">
                  {/* Premium glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/5 via-purple-500/5 to-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-500 shadow-lg`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-3 text-white tracking-tight">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed text-sm">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Get started in minutes and join thousands of successful bidders.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6 lg:gap-8">
            {HOW_IT_WORKS_DATA.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="text-center relative group"
              >
                {index < 3 && (
                  <div className="hidden md:block absolute top-16 left-full w-full z-10">
                    <ChevronRight className="w-6 h-6 text-gray-500 mx-auto opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300 shadow-xl shadow-blue-500/25">
                    <step.icon className="w-9 h-9 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-black font-bold text-xs shadow-lg">
                    {step.step}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold mb-3 text-white tracking-tight">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 lg:py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                What Our Users Say
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {TESTIMONIALS_DATA.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/[0.02] border border-white/20 rounded-2xl p-6 hover:bg-white/10 transition-all duration-500 hover:border-white/30 shadow-xl hover:shadow-2xl"
              >
                {/* Premium glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/5 via-purple-500/5 to-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <Quote className="w-8 h-8 text-blue-400 mb-4 opacity-80" />
                  <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20"
                    />
                    <div>
                      <div className="font-bold text-white">{testimonial.name}</div>
                      <div className="text-gray-400 text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
            whileHover={{ scale: 1.02 }}
            className="relative backdrop-blur-2xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-cyan-600/20 border border-white/20 rounded-2xl p-8 lg:p-12 hover:border-white/30 transition-all duration-500 group shadow-2xl"
          >
            {/* Premium glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/10 via-purple-500/10 to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6 tracking-tight">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Ready to Start Bidding?
                </span>
              </h2>
              <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Join thousands of successful bidders and discover amazing deals in real-time auctions.
              </p>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={onNavigateToRegister}
                className="px-8 lg:px-10 py-3 lg:py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-500 hover:via-purple-500 hover:to-cyan-500 rounded-xl font-bold text-lg transition-all duration-300 inline-flex items-center gap-3 shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6 lg:gap-8 mb-8">
            <div className="space-y-3">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                AuctionPro
              </div>
              <p className="text-gray-400 leading-relaxed max-w-sm text-sm">
                The future of online auctions with real-time bidding and secure transactions.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors duration-300">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">How it Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors duration-300">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors duration-300">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-white/10 text-center">
            <p className="text-gray-400 text-sm">&copy; 2025 AuctionPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;