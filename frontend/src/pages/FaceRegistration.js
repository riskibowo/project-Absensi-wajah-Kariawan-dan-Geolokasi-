import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';

const API = process.env.REACT_APP_API_URL;

export default function FaceRegistration({ user, onLogout }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState(null);

  // --- LOAD MODEL ---
  useEffect(() => {
    loadModels();
  }, []);

  // --- HANDLE CAMERA STREAM ---
  useEffect(() => {
    if (isCapturing && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCapturing, stream]);

  // --- LOAD FACE MODELS ---
  const loadModels = async () => {
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      toast.success('Model pendeteksi wajah berhasil dimuat');
    } catch (error) {
      console.error('Error loading models:', error);
      toast.error('Gagal memuat model pendeteksi wajah');
    }
  };

  // --- START CAMERA ---
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      setStream(mediaStream);
      setIsCapturing(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Izin kamera diblokir. Silakan izinkan melalui pengaturan browser.');
      } else {
        toast.error('Tidak dapat mengakses kamera. Pastikan kamera terpasang.');
      }
    }
  };

  // --- CAPTURE FACE IMAGE ---
  const captureImage = async () => {
    if (!modelsLoaded) {
      toast.error('Model belum dimuat');
      return;
    }

    setLoading(true);
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error('Wajah tidak terdeteksi. Pastikan wajah terlihat jelas.');
        setLoading(false);
        return;
      }

      setCapturedImages((prev) => [...prev, detection.descriptor]);
      toast.success(`Wajah ${capturedImages.length + 1} berhasil ditangkap`);
    } catch (error) {
      console.error('Error capturing face:', error);
      toast.error('Terjadi kesalahan saat menangkap wajah');
    } finally {
      setLoading(false);
    }
  };

  // --- SUBMIT FACE DATA ---
  const handleSubmit = async () => {
    if (capturedImages.length < 3) {
      toast.error('Tangkap minimal 3 gambar wajah dari sudut berbeda');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const descriptors = capturedImages.map((desc) => Array.from(desc));

      await axios.post(
        `${API}/auth/register-face`,
        { descriptors },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Wajah berhasil didaftarkan!');
      if (stream) stream.getTracks().forEach((track) => track.stop());
      navigate('/');
    } catch (error) {
      console.error('Error registering face:', error);
      toast.error(error.response?.data?.detail || 'Gagal mendaftarkan wajah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e8edf3 100%)' }}
    >
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/')} data-testid="back-btn">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1
                  className="text-3xl font-bold"
                  style={{ fontFamily: 'Space Grotesk', color: '#667eea' }}
                  data-testid="page-title"
                >
                  Registrasi Wajah
                </h1>
                <p className="text-gray-600 mt-1">Daftarkan wajah Anda untuk absensi</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="animate-fade-in" data-testid="face-registration-card">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Space Grotesk' }}>Tangkap Wajah Anda</CardTitle>
            <CardDescription>
              Tangkap minimal 3 gambar wajah dari sudut berbeda untuk hasil terbaik
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Camera View */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              {isCapturing ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  data-testid="video-element"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-4">Kamera belum aktif</p>
                    <Button onClick={startCamera} disabled={!modelsLoaded} data-testid="start-camera-btn">
                      {modelsLoaded ? (
                        'Aktifkan Kamera'
                      ) : (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat Models...
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Captured Images Counter */}
            {isCapturing && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-700">
                    {capturedImages.length} gambar ditangkap
                  </span>
                </div>
                <span className="text-sm text-blue-600">(Minimal 3 gambar)</span>
              </div>
            )}

            {/* Action Buttons */}
            {isCapturing && (
              <div className="flex gap-3">
                <Button
                  onClick={captureImage}
                  disabled={loading}
                  className="flex-1"
                  data-testid="capture-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" /> Tangkap Wajah
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={capturedImages.length < 3 || loading}
                  className="flex-1"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  data-testid="submit-face-btn"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Simpan & Selesai
                </Button>
              </div>
            )}

            {/* Tips Section */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">Tips untuk hasil terbaik:</h3>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>Pastikan pencahayaan cukup terang</li>
                <li>Hadapkan wajah langsung ke kamera</li>
                <li>Tangkap dari 3–5 sudut berbeda (depan, kiri, kanan)</li>
                <li>Lepas kacamata atau aksesori yang menutupi wajah</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
