import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const BookingForm = () => {
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [formData, setFormData] = useState({
    age: '',
    symptoms: '',
    healthConcern: '',
    specialty: '',
    doctorId: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDoctors()
  }, [formData.specialty])

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/doctors`, {
        params: { specialty: formData.specialty || undefined },
      })
      setDoctors(response.data)
    } catch (error) {
      console.error('Failed to fetch doctors', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create appointment (auto-confirmed, payment skipped for testing)
      const appointmentResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/appointments`,
        formData
      )

      const roomId = appointmentResponse.data.roomId

      // Show success and redirect to dashboard
      alert('Appointment booked successfully! Payment skipped for testing.')
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">📅 Book a Consultation</h2>
            <p className="text-gray-600">Fill out the form below to schedule your appointment with a specialist</p>
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
                <span className="text-2xl mr-2">👤</span>
                Personal Information
              </h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="120"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                  placeholder="Enter your age"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border border-red-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">🩺</span>
                Medical Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Symptoms <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    placeholder="Describe your symptoms in detail (e.g., fever, headache, cough...)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Main Health Concern <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                    value={formData.healthConcern}
                    onChange={(e) => setFormData({ ...formData, healthConcern: e.target.value })}
                    placeholder="e.g., Chest pain, Skin rash, Anxiety"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">👨‍⚕️</span>
                Doctor Selection
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
                    <option value="">Select a specialty</option>
                    <option value="General Medicine">🩺 General Medicine</option>
                    <option value="Cardiology">❤️ Cardiology</option>
                    <option value="Dermatology">🧴 Dermatology</option>
                    <option value="Pediatrics">👶 Pediatrics</option>
                    <option value="Psychiatry">🧠 Psychiatry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Choose Your Doctor <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white font-medium"
                    value={formData.doctorId}
                    onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  >
                    <option value="">Choose a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id} disabled={!doctor.available}>
                        Dr. {doctor.name} - {doctor.specialty} {!doctor.available && '(Unavailable)'}
                      </option>
                    ))}
                  </select>
                  {formData.specialty && doctors.length === 0 && (
                    <p className="mt-2 text-sm text-orange-600">No doctors available for this specialty</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                ← Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 transition shadow-lg font-semibold"
              >
                {loading ? '⏳ Processing...' : '✅ Book Appointment (Skip Payment)'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default BookingForm
