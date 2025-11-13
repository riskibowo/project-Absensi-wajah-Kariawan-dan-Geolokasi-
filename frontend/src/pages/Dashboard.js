import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogOut, Camera, History, Settings, MapPin, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FaceCapture from '@/components/FaceCapture';

const API = process.env.REACT_APP_API_URL;

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [checkInMode, setCheckInMode] = useState(true);

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/attendance/today-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodayStatus(response.data);
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = () => {
    setCheckInMode(true);
    setShowFaceCapture(true);
  };

  const handleCheckOut = () => {
    setCheckInMode(false);
    setShowFaceCapture(true);
  };

  const onFaceCaptureComplete = () => {
    setShowFaceCapture(false);
    fetchTodayStatus();
  };

  if (showFaceCapture) {
    return (
      <FaceCapture
        mode={checkInMode ? 'check-in' : 'check-out'}
        onComplete={onFaceCaptureComplete}
        onCancel={() => setShowFaceCapture(false)}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e8edf3 100%)' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#667eea' }} data-testid="dashboard-title">FaceAttend</h1>
              <p className="text-gray-600 mt-1">Selamat datang, {user?.name}</p>
            </div>
            <div className="flex gap-3">
              {user?.role === 'admin' && (
                <>
                  <Button variant="outline" onClick={() => navigate('/admin')} data-testid="nav-admin">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/office-settings')} data-testid="nav-office-settings">
                    <MapPin className="mr-2 h-4 w-4" />
                    Office Settings
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => navigate('/history')} data-testid="nav-history">
                <History className="mr-2 h-4 w-4" />
                Riwayat
              </Button>
              <Button variant="outline" onClick={onLogout} data-testid="logout-btn">
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Status Card */}
          <Card className="card-hover animate-fade-in" data-testid="status-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Space Grotesk' }}>
                <Clock className="h-6 w-6 text-blue-500" />
                Status Absensi Hari Ini
              </CardTitle>
              <CardDescription>Status kehadiran Anda untuk hari ini</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Memuat...</div>
              ) : todayStatus?.status === 'not_checked_in' ? (
                <div className="text-center py-6">
                  <div className="mb-4">
                    <div className="inline-block p-4 bg-yellow-100 rounded-full mb-3">
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                    <p className="text-lg font-semibold text-gray-700">Belum Absen</p>
                    <p className="text-sm text-gray-500 mt-1">Silakan check-in untuk memulai</p>
                  </div>
                </div>
              ) : todayStatus?.status === 'checked_in' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-700">Check-In Berhasil</p>
                      <p className="text-sm text-green-600">
                        {new Date(todayStatus.attendance.check_in_time).toLocaleTimeString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Face Match Score</p>
                    <p className="text-2xl font-bold text-blue-600">{todayStatus.attendance.face_match_score?.toFixed(1)}%</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-700">Check-In</p>
                      <p className="text-sm text-green-600">
                        {new Date(todayStatus.attendance.check_in_time).toLocaleTimeString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-700">Check-Out</p>
                      <p className="text-sm text-blue-600">
                        {new Date(todayStatus.attendance.check_out_time).toLocaleTimeString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Card */}
          <Card className="card-hover animate-fade-in" data-testid="action-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Space Grotesk' }}>
                <Camera className="h-6 w-6 text-purple-500" />
                Absensi
              </CardTitle>
              <CardDescription>Lakukan check-in atau check-out dengan face recognition</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!user?.face_descriptors || user.face_descriptors.length === 0 ? (
                <div className="text-center py-6">
                  <div className="mb-4">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="font-semibold text-gray-700 mb-2">Wajah Belum Terdaftar</p>
                    <p className="text-sm text-gray-500 mb-4">Daftarkan wajah Anda terlebih dahulu untuk menggunakan sistem absensi</p>
                  </div>
                  <Button onClick={() => navigate('/face-registration')} className="w-full" data-testid="register-face-btn">
                    <Camera className="mr-2 h-4 w-4" />
                    Daftar Wajah
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayStatus?.status === 'not_checked_in' && (
                    <Button onClick={handleCheckIn} className="w-full h-16 text-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} data-testid="check-in-btn">
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Check-In Sekarang
                    </Button>
                  )}
                  {todayStatus?.status === 'checked_in' && (
                    <Button onClick={handleCheckOut} className="w-full h-16 text-lg" variant="outline" data-testid="check-out-btn">
                      <LogOut className="mr-2 h-5 w-5" />
                      Check-Out Sekarang
                    </Button>
                  )}
                  {todayStatus?.status === 'checked_out' && (
                    <div className="text-center py-6 text-gray-500">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <p className="font-semibold">Absensi Hari Ini Selesai</p>
                      <p className="text-sm mt-1">Terima kasih atas kerja keras Anda!</p>
                    </div>
                  )}
                  <Button variant="outline" onClick={() => navigate('/face-registration')} className="w-full" data-testid="update-face-btn">
                    <Camera className="mr-2 h-4 w-4" />
                    Perbarui Data Wajah
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
