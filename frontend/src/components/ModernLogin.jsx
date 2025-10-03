import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function ModernLogin({ onSwitchToRegister, onBackToLanding }) {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    
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
    await login(formData.email, formData.password)
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm"
    >
      <div className="glass rounded-2xl p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          {/* Back Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBackToLanding}
            className="absolute -top-2 -left-2 w-8 h-8 glass rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>

          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-12 h-12 mx-auto mb-3 glass rounded-xl flex items-center justify-center"
            >
              <Sparkles className="w-6 h-6 text-purple-400" />
            </motion.div>
            <h1 className="font-display text-xl font-bold text-white mb-1">
              Welcome Back
            </h1>
            <p className="text-gray-400 text-sm">Sign in to join live auctions</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={`w-full pl-10 pr-3 py-2.5 bg-gray-800/50 border rounded-xl text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                    errors.email ? 'border-red-500' : 'border-gray-600 focus:border-purple-500'
                  }`}
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
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-10 py-2.5 bg-gray-800/50 border rounded-xl text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                    errors.password ? 'border-red-500' : 'border-gray-600 focus:border-purple-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
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

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full btn-gradient text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </motion.button>
          </form>

          {/* Quick Login */}
          <div className="mt-4 p-3 glass rounded-xl">
            <p className="text-gray-400 text-xs mb-2">Quick login for demo:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-gray-800/30 rounded-lg">
                <div className="text-purple-400 font-medium">Admin</div>
                <div className="text-gray-500 text-xs">admin@example.com</div>
                <div className="text-gray-500 text-xs">admin123</div>
              </div>
              <div className="p-2 bg-gray-800/30 rounded-lg">
                <div className="text-blue-400 font-medium">User</div>
                <div className="text-gray-500 text-xs">john@example.com</div>
                <div className="text-gray-500 text-xs">password123</div>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center mt-4 pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Sign up here
              </button>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ModernLogin