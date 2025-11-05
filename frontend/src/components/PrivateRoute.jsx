import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import axios from 'axios'

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [hasProfile, setHasProfile] = useState(true)

  useEffect(() => {
    const checkDoctorProfile = async () => {
      if (user && user.role === 'DOCTOR' && location.pathname !== '/doctor-onboarding') {
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/doctors/profile`)
          setHasProfile(response.data.hasProfile)
        } catch (error) {
          setHasProfile(false)
        }
      }
      setCheckingProfile(false)
    }

    if (!loading) {
      checkDoctorProfile()
    }
  }, [user, loading, location.pathname])

  if (loading || checkingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  // Redirect doctor to onboarding if profile incomplete
  if (user.role === 'DOCTOR' && !hasProfile && location.pathname !== '/doctor-onboarding') {
    return <Navigate to="/doctor-onboarding" />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />
  }

  return children
}

export default PrivateRoute
