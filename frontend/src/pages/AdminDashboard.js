import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Users, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const API = process.env.REACT_APP_API_URL;

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchName, setSearchName] = useState('');
  const [searchDate, setSearchDate] = useState('');

  // Fetch data absensi
  const fetchAllAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (searchName) params.append('user_name', searchName);
      if (searchDate) params.append('date', searchDate);

      const response = await axios.get(`${API}/attendance/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error(error.response?.data?.detail || 'Gagal memuat data absensi');
    }
  };

  // Fetch data user
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.response?.data?.detail || 'Gagal memuat data karyawan');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAllAttendance(), fetchUsers()]);
      setLoading(false);
    };
    loadData();
  }, [searchName, searchDate]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((att) => att.date === today);
  const checkedIn = todayAttendance.filter((att) => att.status === 'checked_in').length;
  const checkedOut = todayAttendance.filter((att) => att.status === 'checked_out').length;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e8edf3 100%)' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/')} data-testid="back-btn">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#667eea' }}>
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 mt-1">Kelola data absensi dan karyawan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attendance">Manajemen Absensi</TabsTrigger>
            <TabsTrigger value="users">Manajemen Karyawan</TabsTrigger>
          </TabsList>

          {/* Tab Absensi */}
          <TabsContent value="attendance">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6 flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Absen Hari Ini</p>
                    <p className="text-2xl font-bold text-gray-800">{todayAttendance.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sedang Bekerja</p>
                    <p className="text-2xl font-bold text-gray-800">{checkedIn}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sudah Pulang</p>
                    <p className="text-2xl font-bold text-gray-800">{checkedOut}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabel Absensi */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Semua Data Absensi</CardTitle>
                <CardDescription>Daftar lengkap kehadiran karyawan</CardDescription>
                <div className="flex gap-4 pt-4">
                  <Input
                    placeholder="Cari nama karyawan..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                  />
                  <Input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12 text-gray-500">Memuat data...</div>
                ) : attendance.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Tidak ada data absensi untuk filter ini.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Check-In</TableHead>
                          <TableHead>Check-Out</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendance.map((att) => (
                          <TableRow key={att.id}>
                            <TableCell>{formatDate(att.date)}</TableCell>
                            <TableCell>{att.user_name}</TableCell>
                            <TableCell>{att.user_email}</TableCell>
                            <TableCell>{formatTime(att.check_in_time)}</TableCell>
                            <TableCell>{formatTime(att.check_out_time)}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  att.status === 'checked_out'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {att.status === 'checked_out' ? 'Selesai' : 'Check-In'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Karyawan */}
          <TabsContent value="users">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Data Karyawan</CardTitle>
                <CardDescription>Daftar semua pengguna yang terdaftar di sistem.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12 text-gray-500">Memuat data...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Belum ada pengguna terdaftar.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Wajah Terdaftar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.face_descriptors?.length > 0
                                ? `${user.face_descriptors.length} wajah`
                                : 'Belum'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
