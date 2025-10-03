import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function Register({ onSwitchToLogin }) {
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
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
    
    if (formData.password !== formData.confirmPassword) {
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
    <div className="auth-container">
      <div className="auth-header">
        <div className="auth-icon">🎯</div>
        <h1>Create Account</h1>
        <p>Join the auction and start bidding</p>
      </div>
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            type="text"
            name="username"
            className="form-input"
            placeholder="johndoe"
            value={formData.username}
            onChange={handleChange}
            autoFocus
          />
          {errors.username && <span className="form-error">⚠️ {errors.username}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            name="email"
            className="form-input"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && <span className="form-error">⚠️ {errors.email}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            name="password"
            className="form-input"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
          />
          {errors.password && <span className="form-error">⚠️ {errors.password}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            className="form-input"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          {errors.confirmPassword && <span className="form-error">⚠️ {errors.confirmPassword}</span>}
        </div>
        
        <button type="submit" className="btn-primary" disabled={loading}>
          <span>{loading ? 'Creating account...' : 'Create Account'}</span>
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Already have an account?{' '}
          <span className="auth-link" onClick={onSwitchToLogin}>
            Sign in here
          </span>
        </p>
      </div>
    </div>
  )
}

export default Register
