import { useState, useEffect } from 'react'
import axios from 'axios'

const AdminDashboard = () => {
  const [users, setUsers] = useState([])
  const [doctors, setDoctors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [activeTab, setActiveTab] = useState('users')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'users') {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users`)
        setUsers(response.data)
      } else if (activeTab === 'doctors') {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/doctors`)
        setDoctors(response.data)
      } else if (activeTab === 'appointments') {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/appointments`)
        setAppointments(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch data', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage users, doctors, and appointments</p>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('doctors')}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'doctors'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                Doctors
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'appointments'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                Appointments
              </button>
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-600">Loading...</div>
            ) : (
              <>
                {activeTab === 'users' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
                    {users.length === 0 ? (
                      <p className="text-gray-600">No users found</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Email
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Role
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Created
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {user.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                    user.role === 'DOCTOR' ? 'bg-blue-100 text-blue-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {user.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <button className="text-red-600 hover:text-red-800 font-medium">
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'doctors' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Doctor Management</h2>
                    {doctors.length === 0 ? (
                      <p className="text-gray-600">No doctors found</p>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {doctors.map((doctor) => (
                          <div key={doctor.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                            <h3 className="font-semibold text-lg text-gray-900">{doctor.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{doctor.email}</p>
                            <div className="mt-3 space-y-2">
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">Specialty:</span>{' '}
                                <span className="text-gray-900">{doctor.doctorInfo?.specialty || 'N/A'}</span>
                              </p>
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">License:</span>{' '}
                                <span className="text-gray-900">{doctor.doctorInfo?.licenseNumber || 'N/A'}</span>
                              </p>
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">Status:</span>{' '}
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  doctor.doctorInfo?.available 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {doctor.doctorInfo?.available ? 'Available' : 'Unavailable'}
                                </span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'appointments' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointment Management</h2>
                    {appointments.length === 0 ? (
                      <p className="text-gray-600">No appointments found</p>
                    ) : (
                      <div className="space-y-3">
                        {appointments.map((apt) => (
                          <div key={apt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">
                                  Patient: {apt.patient?.name || 'Unknown'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Doctor: {apt.doctor?.name || 'Unknown'}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Specialty: {apt.specialty}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {new Date(apt.scheduledAt).toLocaleString()}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                apt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                apt.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {apt.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
