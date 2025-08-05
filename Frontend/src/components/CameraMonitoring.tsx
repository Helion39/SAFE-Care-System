import React, { useState, useEffect, useRef } from 'react';
import { Camera, Play, Pause, AlertTriangle, Maximize2, Volume2, VolumeX } from 'lucide-react';

// --- INTERFACE & TIPE DATA (Tidak Berubah) ---
interface CameraInfo {
  id: string;
  room_number: string;
  status: 'active' | 'offline';
  last_checked: string;
}

interface Resident {
  id: string;
  _id: string;
  name: string;
  room?: string;
  room_number?: string;
}

// Tipe untuk hasil deteksi dari backend
interface Detection {
    box: [number, number, number, number];
    track_id: number;
    status: 'tracking' | 'fallen' | 'confirm_needed';
}

// Tipe untuk props komponen CameraFeed
interface CameraFeedProps {
  stream: MediaStream | null;
  isMuted: boolean;
  onVideoRef: (el: HTMLVideoElement | null) => void; // Callback untuk mendapatkan ref video
}

// --- Komponen CameraFeed (Sedikit Dimodifikasi) ---
// Kita tambahkan callback 'onVideoRef' untuk bisa mengakses elemen video dari parent.
function CameraFeed({ stream, isMuted, onVideoRef }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      // Panggil callback untuk mendaftarkan ref ke parent
      onVideoRef(videoRef.current);
    }
  }, [onVideoRef]); // Hanya bergantung pada onVideoRef untuk pendaftaran awal

  useEffect(() => {
    // Efek ini HANYA mengelola stream video
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]); // Hanya bergantung pada stream

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      className="w-full h-full object-cover"
      // Tambahkan event listener ini!
      onLoadedMetadata={(e) => (e.currentTarget.style.opacity = '1')}
      style={{ opacity: '0', transition: 'opacity 0.5s' }}
    />
  );
}

// --- Komponen Utama CameraMonitoring (Perubahan Besar) ---
interface CameraMonitoringProps {
  data: {
    camera_info: CameraInfo[];
    residents: Resident[];
  };
  onTriggerAlert: (residentId: string) => void;
}

export function CameraMonitoring({ data, onTriggerAlert }: CameraMonitoringProps) {
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<{ [key: string]: boolean }>({});
  const [isMuted, setIsMuted] = useState<{ [key: string]: boolean }>({});
  const [fallDetectionEnabled, setFallDetectionEnabled] = useState<{ [key: string]: boolean }>({});
  const [streams, setStreams] = useState<{ [key: string]: MediaStream | null }>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // --- STATE BARU UNTUK DETEKSI ---
  const [detections, setDetections] = useState<{ [cameraId: string]: Detection[] }>({});
  const [pendingConfirmation, setPendingConfirmation] = useState<{ cameraId: string; trackId: number } | null>(null);
  
  // --- REFS UNTUK MENGAKSES ELEMEN & INTERVAL ---
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const detectionIntervals = useRef<{ [key: string]: NodeJS.Timeout | null }>({});

  const cameras = data.camera_info || [];
  const residents = data.residents || [];

  // --- LOGIKA UNTUK MEMULAI STREAM KAMERA (Tidak Berubah) ---
  useEffect(() => {
    const startIndividualStreams = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
        if (videoDevices.length === 0) return;

        const newStreams: { [key: string]: MediaStream } = {};
        const activeCameras = cameras.filter(c => c.status === 'active');
        
        for (let i = 0; i < activeCameras.length; i++) {
          const uiCamera = activeCameras[i];
          const physicalDevice = videoDevices[i] || videoDevices[videoDevices.length - 1]; 
          if (physicalDevice) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: physicalDevice.deviceId } },
                audio: false
              });
              newStreams[uiCamera.id] = stream;
            } catch (err) {
              console.error(`Gagal memulai stream untuk kamera ${uiCamera.room_number}`, err);
            }
          }
        }
        setStreams(newStreams);
      } catch (error) {
        console.error("Error mengakses media devices:", error);
      }
    };
    if (cameras.length > 0) startIndividualStreams();

    return () => {
      Object.values(streams).forEach(stream => stream?.getTracks().forEach(track => track.stop()));
      Object.values(detectionIntervals.current).forEach(interval => interval && clearInterval(interval));
    };
  }, [cameras]);

  // --- EFEK BARU: MENGELOLA PROSES DETEKSI PER KAMERA ---
  useEffect(() => {
    cameras.forEach(camera => {
      const isEnabled = fallDetectionEnabled[camera.id] || false;
      const intervalId = detectionIntervals.current[camera.id];

      if (isEnabled && !intervalId) {
        // Jika deteksi diaktifkan, mulai interval untuk mengirim frame
        detectionIntervals.current[camera.id] = setInterval(() => {
          processFrame(camera.id);
        }, 500); // Kirim frame setiap 500ms
      } else if (!isEnabled && intervalId) {
        // Jika dinonaktifkan, hentikan interval
        clearInterval(intervalId);
        detectionIntervals.current[camera.id] = null;
        // Hapus deteksi yang ada di layar
        setDetections(prev => ({ ...prev, [camera.id]: [] }));
      }
    });
  }, [fallDetectionEnabled, streams]);

  // --- EFEK BARU: MENGGAMBAR HASIL DETEKSI DI CANVAS ---
  // GANTI useEffect yang lama dengan yang ini.
useEffect(() => {
    // Buat sebuah variabel untuk membatalkan frame animasi jika komponen di-unmount
    let animationFrameId: number;

    const drawDetections = () => {
        Object.entries(detections).forEach(([cameraId, dets]) => {
            const canvas = canvasRefs.current[cameraId];
            const video = videoRefs.current[cameraId];

            // Pengecekan penting: pastikan semua elemen ada dan siap
            if (canvas && video && video.readyState >= 2 && video.videoWidth > 0) {
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // --- INI BAGIAN KUNCI ---
                // Dapatkan posisi dan ukuran video YANG SEBENARNYA di layar
                const videoRect = video.getBoundingClientRect();

                // Dapatkan posisi canvas (atau parent-nya) untuk menghitung offset
                // Kita gunakan parent dari canvas agar lebih aman
                const canvasParentRect = canvas.parentElement!.getBoundingClientRect();

                // Set ukuran canvas sama persis dengan ukuran video di layar
                canvas.width = videoRect.width;
                canvas.height = videoRect.height;
                
                // Set posisi canvas agar TEPAT menimpa video, dengan menghitung offset
                canvas.style.position = 'absolute';
                canvas.style.top = `${videoRect.top - canvasParentRect.top}px`;
                canvas.style.left = `${videoRect.left - canvasParentRect.left}px`;
                // -------------------------

                // Kalkulasi skala baru berdasarkan ukuran canvas yang sudah benar
                const scaleX = canvas.width / video.videoWidth;
                const scaleY = canvas.height / video.videoHeight;

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                dets.forEach(det => {
                    const [x1, y1, x2, y2] = det.box;
                    
                    // Gambar kotak seperti sebelumnya, tapi dengan skala yang sudah pasti benar
                    ctx.strokeStyle = '#34C759'; // Hijau
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x1 * scaleX, y1 * scaleY, (x2 - x1) * scaleX, (y2 - y1) * scaleY);

                    // ... (sisa kode untuk menggambar teks ID tidak perlu diubah)
                    ctx.font = 'bold 14px Arial';
                    const label = `ID: ${det.track_id}`;
                    const textWidth = ctx.measureText(label).width;
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.fillRect(x1 * scaleX, y1 * scaleY - 18, textWidth + 8, 20);
                    ctx.fillStyle = 'white';
                    ctx.fillText(label, (x1 * scaleX) + 4, y1 * scaleY - 4);
                });
            }
        });
        
        // Minta browser untuk menjalankan `drawDetections` lagi di frame berikutnya
        animationFrameId = requestAnimationFrame(drawDetections);
    };

    // Mulai loop animasi
    animationFrameId = requestAnimationFrame(drawDetections);

    // Fungsi cleanup: Hentikan loop animasi saat komponen tidak lagi ditampilkan
    return () => {
        cancelAnimationFrame(animationFrameId);
    };
}, [detections]); // Kita tetap bergantung pada 'detections' untuk memicu render ulang awal 

useEffect(() => {
    // Buat elemen audio sekali saja dan simpan di ref
    if (!audioRef.current) {
        audioRef.current = new Audio('/alarm.mp3'); // Path ke file di folder public
        audioRef.current.loop = true; // Agar suara berulang
    }

    // Mainkan atau hentikan suara berdasarkan state 'pendingConfirmation'
    if (pendingConfirmation) {
        audioRef.current?.play().catch(error => console.error("Audio play failed:", error));
    } else {
        audioRef.current?.pause();
        if (audioRef.current) {
            audioRef.current.currentTime = 0; // Reset audio ke awal
        }
    }

    // Cleanup: pastikan suara berhenti jika komponen di-unmount
    return () => {
        audioRef.current?.pause();
    };
  }, [pendingConfirmation]);

  // --- FUNGSI BARU: MENGIRIM FRAME KE BACKEND ---
  const processFrame = async (cameraId: string) => {
    const video = videoRefs.current[cameraId];
    if (!video || video.readyState < 2) return;

    // Gunakan canvas sementara untuk mengambil gambar dari video
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    const imageBase64 = tempCanvas.toDataURL('image/jpeg');

    try {
      const response = await fetch('http://localhost:5001/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      
      const result = await response.json();
      setDetections(prev => ({ ...prev, [cameraId]: result.detections }));

      // Cek jika ada permintaan konfirmasi
      if (result.pending_id && !pendingConfirmation) {
        setPendingConfirmation({ cameraId, trackId: result.pending_id });
      }

    } catch (error) {
      console.error('Error sending frame for detection:', error);
    }
  };
  
  // --- FUNGSI BARU: MENGELOLA KONFIRMASI JATUH ---
  const handleConfirmFall = async () => {
    if (!pendingConfirmation) return;
    try {
        await fetch('http://localhost:5001/api/confirm_fall', { /* ... */ });
    } catch (error) {
        console.error('Error confirming fall:', error);
    }
    // Hentikan suara setelah aksi
    setPendingConfirmation(null); 
  };

  const handleDenyFall = async () => {
    if (!pendingConfirmation) return;
     try {
        await fetch('http://localhost:5001/api/deny_fall', { /* ... */ });
    } catch (error) {
        console.error('Error denying fall:', error);
    }
    // Hentikan suara setelah aksi
    setPendingConfirmation(null);
  };


  const getCameraResident = (roomNumber: string): Resident | undefined => {
    return residents.find((r) => (r.room || r.room_number) === roomNumber);
  };
  const toggleRecording = (cameraId: string) => setIsRecording(prev => ({ ...prev, [cameraId]: !prev[cameraId] }));
  const toggleMute = (cameraId: string) => setIsMuted(prev => ({ ...prev, [cameraId]: !prev[cameraId] }));
  const toggleFallDetection = (cameraId: string) => {
    // --- TAMBAHAN: Logika untuk "membuka kunci" audio ---
    // Browser modern memblokir audio otomatis. Ini trik untuk mengizinkannya.
    if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
        audioRef.current.pause();
    }
    // --- AKHIR TAMBAHAN ---

    setFallDetectionEnabled(prev => ({ ...prev, [cameraId]: !prev[cameraId] }));
  };

  // Hapus fungsi `simulateFallDetection` karena sudah digantikan dengan deteksi asli
  // const simulateFallDetection = ...

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="card-header">
        <Camera />
        Camera Monitoring System
      </div>

      {/* Camera Grid */}
      <div className="grid grid-2">
        {cameras.map((camera) => {
          const resident = getCameraResident(camera.room_number);
          const isActive = camera.status === 'active';
          const isSelected = selectedCamera === camera.id;
          const stream = streams[camera.id];

          return (
            <div key={camera.id} className="card">
              {/* Camera Header (tidak berubah) */}
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600' }}>
                    Room {camera.room_number}
                  </h3>
                  {resident && (
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)' }}>
                      {resident.name}
                    </p>
                  )}
                </div>
                <span className={`badge ${isActive ? 'badge-success' : 'badge-error'}`}>
                  {isActive ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Camera Feed & Overlay */}
              <div
                className="bg-gray-100 rounded-lg overflow-hidden"
                // TAMBAHKAN STYLE INI SECARA EKSPLISIT
                style={{ position: 'relative', aspectRatio: '16/9' }}
              >
                {isActive && stream ? (
                  <>
                    <CameraFeed
                      stream={stream}
                      isMuted={isMuted[camera.id] || false}
                      onVideoRef={(el) => (videoRefs.current[camera.id] = el)}
                    />
                    <canvas
                      ref={(el) => (canvasRefs.current[camera.id] = el)}
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    />
                  </>
                ) : (
                  // ... Tampilan saat kamera loading atau offline
                  <div className="flex items-center justify-center h-full bg-gray-300 text-gray-600">
                    <div className="text-center">
                      <AlertTriangle style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem' }} />
                      <p>Camera Offline</p>
                    </div>
                  </div>
                )}
                
                {/* Camera Controls Overlay (tidak berubah) */}
                {isActive && (
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                    {/* ... tombol play, mute, maximize ... */}
                  </div>
                )}
              </div>

              {/* Fall Detection Controls (fungsi simulate dihapus) */}
              {isActive && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500' }}>
                      Fall Detection AI
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fallDetectionEnabled[camera.id] || false}
                        onChange={() => toggleFallDetection(camera.id)}
                        className="w-4 h-4"
                      />
                      <span style={{ fontSize: 'var(--text-sm)' }}>Enabled</span>
                    </label>
                  </div>
                  
                  {fallDetectionEnabled[camera.id] && (
                     <div className="flex gap-2">
                         <span className="badge badge-success" style={{ fontSize: 'var(--text-xs)' }}>
                           AI Active
                         </span>
                     </div>
                  )}
                </div>
              )}

              {/* Camera Info (tidak berubah) */}
              <div className="mt-2 text-xs text-gray-500">
                Last checked: {new Date(camera.last_checked).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- MODAL BARU UNTUK KONFIRMASI JATUH --- */}
      {pendingConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="card w-96">
                <h3 className="text-lg font-bold">Konfirmasi Diperlukan!</h3>
                <p className="py-4">
                    Sistem mendeteksi potensi insiden jatuh di 
                    <strong> Room {cameras.find(c => c.id === pendingConfirmation.cameraId)?.room_number}</strong>.
                    <br/>
                    Apakah Anda ingin mengonfirmasi dan mengirim peringatan?
                </p>
                <div className="flex justify-end gap-2">
                    <button onClick={handleDenyFall} className="btn btn-secondary">Tolak (Salah Alarm)</button>
                    <button onClick={handleConfirmFall} className="btn btn-error">Ya, Konfirmasi Jatuh</button>
                </div>
            </div>
        </div>
      )}

      {/* Selected Camera Full View */}
      {selectedCamera && (
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: '600' }}>
              Room {cameras.find((c) => c.id === selectedCamera)?.room_number} - Full View
            </h3>
            <button
              onClick={() => setSelectedCamera(null)}
              className="btn btn-sm btn-secondary"
            >
              Close
            </button>
          </div>
          
          <div 
            className="bg-gray-800 rounded-lg overflow-hidden"
            style={{ aspectRatio: '16/9', minHeight: '400px' }}
          >
            {streams[selectedCamera] ? (
                  <CameraFeed 
                      stream={streams[selectedCamera]} 
                      isMuted={isMuted[selectedCamera] || false} 
                      onVideoRef={() => {}} // <-- TAMBAHKAN BARIS INI
                  />
                ) : (
                    <div className="flex items-center justify-center h-full text-white">
                        <p>Kamera tidak tersedia.</p>
                    </div>
                )}
          </div>
        </div>
      )}
    </div>
  );
}