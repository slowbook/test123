import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/appointments`)
      setAppointments(response.data)
    } catch (error) {
      console.error('Failed to fetch appointments', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = (roomId) => {
    navigate(`/consultation/${roomId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">🏥 Telehealth</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-800 font-medium">
                Welcome, <span className="text-indigo-600">{user?.name}</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                {user?.role}
              </span>
              {user?.role === 'PATIENT' && (
                <button
                  onClick={() => navigate('/book')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm font-medium"
                >
                  📅 Book Appointment
                </button>
              )}
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition shadow-sm font-medium"
                >
                  ⚙️ Admin Panel
                </button>
              )}
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-sm font-medium"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {user?.role === 'PATIENT' ? '📋 My Appointments' : '🩺 Pending Consultations'}
            </h2>
            <p className="text-gray-600 mt-2">
              {user?.role === 'PATIENT' 
                ? 'Manage your upcoming and past consultations' 
                : 'Review and join patient consultations'}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin text-6xl mb-4">⏳</div>
              <p className="text-gray-600 text-lg">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No appointments yet</h3>
              <p className="text-gray-600 mb-6">
                {user?.role === 'PATIENT' 
                  ? 'Book your first consultation to get started' 
                  : 'No pending consultations at the moment'}
              </p>
              {user?.role === 'PATIENT' && (
                <button
                  onClick={() => navigate('/book')}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition shadow-md font-medium text-lg"
                >
                  📅 Book Your First Appointment
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{appointment.specialty}</h3>
                      <p className="text-sm text-gray-700 font-medium mt-1">
                        {user?.role === 'PATIENT' ? `👨‍⚕️ Dr. ${appointment.doctorName}` : `👤 ${appointment.patientName}`}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        appointment.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : appointment.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : appointment.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 mb-4">
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="mr-2">🕐</span>
                      {new Date(appointment.scheduledAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                  {appointment.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleJoinRoom(appointment.roomId)}
                      className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition shadow-md font-semibold"
                    >
                      🎥 Join Consultation
                    </button>
                  )}
                  {appointment.status === 'COMPLETED' && (
                    <button
                      disabled
                      className="w-full bg-gray-200 text-gray-600 py-3 rounded-lg cursor-not-allowed font-semibold"
                    >
                      ✅ Completed
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
