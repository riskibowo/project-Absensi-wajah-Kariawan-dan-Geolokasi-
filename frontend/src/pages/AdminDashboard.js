import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Users, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL;

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/attendance/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate stats
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(att => att.date === today);
  const checkedIn = todayAttendance.filter(att => att.status === 'checked_in').length;
  const checkedOut = todayAttendance.filter(att => att.status === 'checked_out').length;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e8edf3 100%)' }}>
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/')} data-testid="back-btn">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#667eea' }} data-testid="page-title">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">Kelola data absensi karyawan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="card-hover" data-testid="stat-total">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Absen Hari Ini</p>
                  <p className="text-2xl font-bold text-gray-800">{todayAttendance.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover" data-testid="stat-checked-in">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sedang Bekerja</p>
                  <p className="text-2xl font-bold text-gray-800">{checkedIn}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover" data-testid="stat-checked-out">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sudah Pulang</p>
                  <p className="text-2xl font-bold text-gray-800">{checkedOut}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Table */}
        <Card className="animate-fade-in" data-testid="attendance-table">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Space Grotesk' }}>Semua Data Absensi</CardTitle>
            <CardDescription>Daftar lengkap kehadiran karyawan</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-gray-500">Memuat data...</div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada data absensi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tanggal</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Nama</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Check-In</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Check-Out</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((att, index) => (
                      <tr key={att.id} className="border-b hover:bg-gray-50" data-testid={`attendance-row-${index}`}>
                        <td className="py-3 px-4">{formatDate(att.date)}</td>
                        <td className="py-3 px-4 font-medium">{att.user_name}</td>
                        <td className="py-3 px-4 text-gray-600">{att.user_email}</td>
                        <td className="py-3 px-4">{formatTime(att.check_in_time)}</td>
                        <td className="py-3 px-4">{formatTime(att.check_out_time)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            att.status === 'checked_out'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {att.status === 'checked_out' ? 'Selesai' : 'Check-In'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
