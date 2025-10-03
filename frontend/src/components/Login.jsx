import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function Login({ onSwitchToRegister }) {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

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
    <div className="auth-container">
      <div className="auth-header">
        <div className="auth-icon">🔨</div>
        <h1>Welcome Back</h1>
        <p>Sign in to join the live auction</p>
      </div>
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            name="email"
            className="form-input"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            autoFocus
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
        
        <button type="submit" className="btn-primary" disabled={loading}>
          <span>{loading ? 'Signing in...' : 'Sign In'}</span>
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Don't have an account?{' '}
          <span className="auth-link" onClick={onSwitchToRegister}>
            Register here
          </span>
        </p>
      </div>
    </div>
  )
}

export default Login
