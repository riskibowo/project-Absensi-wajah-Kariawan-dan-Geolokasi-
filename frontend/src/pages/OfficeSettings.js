import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL;

export default function OfficeSettings({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: 'Kantor Utama',
    latitude: 0,
    longitude: 0,
    radius: 100
  });

  useEffect(() => {
    fetchOfficeLocation();
  }, []);

  const fetchOfficeLocation = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/office/location`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentLocation(response.data);
      setFormData({
        name: response.data.name,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        radius: response.data.radius
      });
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching office location:', error);
      }
    }
  };

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation tidak didukung browser Anda');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        toast.success('Lokasi berhasil didapatkan!');
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.');
        setLoading(false);
      }
    );
  };

  const handleChange = (e) => {
    const value = e.target.name === 'name' ? e.target.value : parseFloat(e.target.value);
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/office/location`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Lokasi kantor berhasil disimpan!');
      fetchOfficeLocation();
    } catch (error) {
      console.error('Error saving office location:', error);
      toast.error(error.response?.data?.detail || 'Gagal menyimpan lokasi');
    } finally {
      setLoading(false);
    }
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
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#667eea' }} data-testid="page-title">Pengaturan Lokasi Kantor</h1>
                <p className="text-gray-600 mt-1">Atur lokasi dan radius kantor</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Current Location */}
          {currentLocation && (
            <Card className="animate-fade-in" data-testid="current-location-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Space Grotesk' }}>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  Lokasi Saat Ini
                </CardTitle>
                <CardDescription>Lokasi kantor yang aktif</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Nama</p>
                  <p className="font-semibold text-gray-800">{currentLocation.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Koordinat</p>
                  <p className="font-mono text-sm text-gray-800">
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Radius</p>
                  <p className="font-semibold text-gray-800">{currentLocation.radius} meter</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Set Location Form */}
          <Card className="animate-fade-in" data-testid="set-location-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Space Grotesk' }}>
                <MapPin className="h-6 w-6 text-blue-500" />
                {currentLocation ? 'Update Lokasi' : 'Set Lokasi Baru'}
              </CardTitle>
              <CardDescription>Atur atau perbarui lokasi kantor</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lokasi</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Kantor Utama"
                    required
                    data-testid="location-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="-6.200000"
                    required
                    data-testid="location-latitude"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="106.816666"
                    required
                    data-testid="location-longitude"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="radius">Radius (meter)</Label>
                  <Input
                    id="radius"
                    name="radius"
                    type="number"
                    value={formData.radius}
                    onChange={handleChange}
                    placeholder="100"
                    required
                    data-testid="location-radius"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentPosition}
                  disabled={loading}
                  className="w-full"
                  data-testid="get-current-location-btn"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mendapatkan Lokasi...</>
                  ) : (
                    <><MapPin className="mr-2 h-4 w-4" />Gunakan Lokasi Saat Ini</>
                  )}
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  data-testid="save-location-btn"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                  ) : (
                    <><CheckCircle className="mr-2 h-4 w-4" />Simpan Lokasi</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
