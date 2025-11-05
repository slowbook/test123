import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BookingForm from './pages/BookingForm'
import ConsultationRoom from './pages/ConsultationRoom'
import AdminDashboard from './pages/AdminDashboard'
import DoctorOnboarding from './pages/DoctorOnboarding'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/doctor-onboarding"
              element={
                <PrivateRoute requiredRole="DOCTOR">
                  <DoctorOnboarding />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/book"
              element={
                <PrivateRoute>
                  <BookingForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/consultation/:roomId"
              element={
                <PrivateRoute>
                  <ConsultationRoom />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute requiredRole="ADMIN">
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
