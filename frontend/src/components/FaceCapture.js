import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera, X, Loader2, MapPin, CheckCircle } from 'lucide-react';
import * as faceapi from 'face-api.js';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function FaceCapture({ mode, onComplete, onCancel }) {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [stream, setStream] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    loadModels();
    getLocation();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const loadModels = async () => {
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
      startCamera();
    } catch (error) {
      console.error('Error loading models:', error);
      toast.error('Error loading face detection models');
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Tidak dapat mengakses kamera');
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation tidak didukung');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.');
        setLocationLoading(false);
      }
    );
  };

  const handleCapture = async () => {
    if (!modelsLoaded) {
      toast.error('Models belum dimuat');
      return;
    }

    if (!location && mode === 'check-in') {
      toast.error('Lokasi belum tersedia');
      return;
    }

    setLoading(true);
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error('Wajah tidak terdeteksi. Pastikan wajah Anda terlihat jelas.');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const descriptor = Array.from(detection.descriptor);

      if (mode === 'check-in') {
        await axios.post(
          `${API}/attendance/check-in`,
          {
            latitude: location.latitude,
            longitude: location.longitude,
            face_descriptor: descriptor
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Check-in berhasil!');
      } else {
        await axios.post(
          `${API}/attendance/check-out`,
          {
            latitude: location.latitude,
            longitude: location.longitude
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Check-out berhasil!');
      }

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      onComplete();
    } catch (error) {
      console.error('Error during attendance:', error);
      toast.error(error.response?.data?.detail || 'Terjadi kesalahan');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card className="w-full max-w-2xl animate-fade-in" data-testid="face-capture-card">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2" style={{ fontFamily: 'Space Grotesk' }}>
                <Camera className="h-6 w-6" />
                {mode === 'check-in' ? 'Check-In' : 'Check-Out'}
              </CardTitle>
              <CardDescription>
                {mode === 'check-in' 
                  ? 'Posisikan wajah Anda di depan kamera untuk check-in'
                  : 'Konfirmasi check-out Anda'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel} data-testid="cancel-btn">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera View */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              data-testid="video-element"
            />
            {!modelsLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-2" />
                  <p>Memuat face detection...</p>
                </div>
              </div>
            )}
          </div>

          {/* Location Status */}
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            locationLoading ? 'bg-yellow-50' : location ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <MapPin className={`h-5 w-5 ${
              locationLoading ? 'text-yellow-600' : location ? 'text-green-600' : 'text-red-600'
            }`} />
            <span className={`text-sm font-medium ${
              locationLoading ? 'text-yellow-700' : location ? 'text-green-700' : 'text-red-700'
            }`}>
              {locationLoading ? 'Mendapatkan lokasi...' : location ? 'Lokasi terdeteksi' : 'Lokasi tidak tersedia'}
            </span>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleCapture}
            disabled={loading || !modelsLoaded || (!location && mode === 'check-in')}
            className="w-full h-14 text-lg"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            data-testid="capture-submit-btn"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Memproses...</>
            ) : (
              <><CheckCircle className="mr-2 h-5 w-5" />{mode === 'check-in' ? 'Check-In' : 'Check-Out'}</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
