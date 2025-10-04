import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, UserPlus, Sparkles, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function ModernRegister({ onSwitchToLogin, onBackToLanding }) {
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (formData.username.length > 20) {
      newErrors.username = 'Username cannot exceed 20 characters'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    await register(formData.username, formData.email, formData.password)
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm"
    >
      <div className="glass rounded-2xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(39,39,42,0.6), rgba(0,0,0,0.8))', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,215,0,0.2)' }}>
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-red-500/10 to-transparent rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          {/* Back Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBackToLanding}
            className="absolute -top-2 -left-2 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,215,0,0.2)' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>

          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,215,0,0.2)' }}
            >
              <UserPlus className="w-6 h-6 text-yellow-400" />
            </motion.div>
            <h1 className="font-display text-xl font-bold text-white mb-1">
              Join the Auction
            </h1>
            <p className="text-sm" style={{ color: '#C0C0C0' }}>Create your account to start bidding</p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#C0C0C0' }}>
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4" style={{ color: '#C0C0C0' }} />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  className={`w-full pl-10 pr-3 py-2.5 border rounded-xl text-white text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.username ? 'border-red-500' : 'focus:ring-yellow-500'
                  }`}
                  style={{ 
                    background: 'rgba(0,0,0,0.4)', 
                    borderColor: errors.username ? '#ef4444' : 'rgba(255,215,0,0.3)',
                    color: '#E5E5E5'
                  }}
                />
              </div>
              {errors.username && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1"
                >
                  {errors.username}
                </motion.p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#C0C0C0' }}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4" style={{ color: '#C0C0C0' }} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={`w-full pl-10 pr-3 py-2.5 border rounded-xl text-white text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.email ? 'border-red-500' : 'focus:ring-yellow-500'
                  }`}
                  style={{ 
                    background: 'rgba(0,0,0,0.4)', 
                    borderColor: errors.email ? '#ef4444' : 'rgba(255,215,0,0.3)',
                    color: '#E5E5E5'
                  }}
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1"
                >
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#C0C0C0' }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4" style={{ color: '#C0C0C0' }} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-xl text-white text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.password ? 'border-red-500' : 'focus:ring-yellow-500'
                  }`}
                  style={{ 
                    background: 'rgba(0,0,0,0.4)', 
                    borderColor: errors.password ? '#ef4444' : 'rgba(255,215,0,0.3)',
                    color: '#E5E5E5'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-yellow-300 transition-colors"
                  style={{ color: '#C0C0C0' }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#C0C0C0' }}>
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4" style={{ color: '#C0C0C0' }} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-xl text-white text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.confirmPassword ? 'border-red-500' : 'focus:ring-yellow-500'
                  }`}
                  style={{ 
                    background: 'rgba(0,0,0,0.4)', 
                    borderColor: errors.confirmPassword ? '#ef4444' : 'rgba(255,215,0,0.3)',
                    color: '#E5E5E5'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-yellow-300 transition-colors"
                  style={{ color: '#C0C0C0' }}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1"
                >
                  {errors.confirmPassword}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full text-black font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FF4C29)' }}
            >
              {loading ? (
                <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full"></div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create Account
                </>
              )}
            </motion.button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,215,0,0.2)' }}>
            <p className="text-sm" style={{ color: '#C0C0C0' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ModernRegister