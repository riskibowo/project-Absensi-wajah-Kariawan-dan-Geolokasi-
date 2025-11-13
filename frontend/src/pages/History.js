import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL;

export default function History({ user }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/attendance/my-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-';
    const diff = new Date(checkOut) - new Date(checkIn);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}j ${minutes}m`;
  };

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
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#667eea' }} data-testid="page-title">Riwayat Absensi</h1>
                <p className="text-gray-600 mt-1">Lihat riwayat kehadiran Anda</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="animate-fade-in" data-testid="history-card">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Space Grotesk' }}>Daftar Kehadiran</CardTitle>
            <CardDescription>Riwayat absensi Anda</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-gray-500">Memuat data...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada riwayat absensi</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((att, index) => (
                  <div
                    key={att.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    data-testid={`history-item-${index}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        <span className="font-semibold text-gray-700">{formatDate(att.date)}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        att.status === 'checked_out' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {att.status === 'checked_out' ? 'Selesai' : 'Check-In'}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-500">Check-In</p>
                          <p className="font-semibold text-green-700">{formatTime(att.check_in_time)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500">Check-Out</p>
                          <p className="font-semibold text-blue-700">{formatTime(att.check_out_time)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-xs text-gray-500">Durasi</p>
                          <p className="font-semibold text-purple-700">{calculateDuration(att.check_in_time, att.check_out_time)}</p>
                        </div>
                      </div>
                    </div>

                    {att.face_match_score && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Face Match:</span>
                          <span className="text-sm font-semibold text-blue-600">{att.face_match_score.toFixed(1)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
