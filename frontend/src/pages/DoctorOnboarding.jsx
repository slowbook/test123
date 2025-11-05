import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const DoctorOnboarding = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    specialty: '',
    licenseNumber: '',
    bio: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/doctors/profile`, formData)
      alert('✅ Profile completed successfully!')
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
          <div className="mb-8 text-center">
            <div className="text-6xl mb-4">👨‍⚕️</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Complete Your Doctor Profile</h2>
            <p className="text-gray-600">Welcome, Dr. {user?.name}! Please provide your professional information</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-lg mb-6 flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">🩺</span>
                Professional Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Medical Specialty <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white font-medium"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  >
                    <option value="">Select your specialty</option>
                    <option value="General Medicine">🩺 General Medicine</option>
                    <option value="Cardiology">❤️ Cardiology</option>
                    <option value="Dermatology">🧴 Dermatology</option>
                    <option value="Pediatrics">👶 Pediatrics</option>
                    <option value="Psychiatry">🧠 Psychiatry</option>
                    <option value="Orthopedics">🦴 Orthopedics</option>
                    <option value="Neurology">🧠 Neurology</option>
                    <option value="Gynecology">👩‍⚕️ Gynecology</option>
                    <option value="ENT">👂 ENT (Ear, Nose & Throat)</option>
                    <option value="Ophthalmology">👁️ Ophthalmology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Medical License Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                    placeholder="e.g., MD123456"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  />
                  <p className="text-xs text-gray-600 mt-1">Enter your valid medical license number</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">📝</span>
                About You
              </h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Professional Bio (Optional)
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell patients about your experience, qualifications, and approach to healthcare..."
                />
                <p className="text-xs text-gray-600 mt-1">This will be visible to patients when they book appointments</p>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-4 rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 transition shadow-lg font-semibold text-lg"
              >
                {loading ? '⏳ Saving Profile...' : '✅ Complete Profile & Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default DoctorOnboarding
