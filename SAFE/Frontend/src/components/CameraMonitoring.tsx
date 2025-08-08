import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, AlertTriangle } from 'lucide-react';

// --- INTERFACE & TIPE DATA (Tidak ada perubahan) ---
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
  room_number?: string;
}
interface Detection {
    box: [number, number, number, number];
    track_id: number;
    status: string;
}

// --- Komponen Kartu Kamera (Tidak ada perubahan signifikan) ---
// Komponen ini sudah siap menerima stream dinamis dari parent.
function CameraCard({ camera, resident, stream, onConfirmNeeded }: {
    camera: CameraInfo;
    resident?: Resident;
    stream: MediaStream | null;
    onConfirmNeeded: (cameraId: string, trackId: number) => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fallDetectionEnabled, setFallDetectionEnabled] = useState(false);
    const detectionInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const processFrame = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = videoRef.current.videoWidth;
        tempCanvas.height = videoRef.current.videoHeight;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
        const imageBase64 = tempCanvas.toDataURL('image/jpeg');
        try {
            const response = await fetch('http://localhost:5001/api/detect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageBase64 }),
            });
            const result = await response.json();
            if (canvasRef.current && videoRef.current && result.detections) {
                const canvasCtx = canvasRef.current.getContext('2d');
                if(!canvasCtx) return;
                canvasRef.current.width = videoRef.current.clientWidth;
                canvasRef.current.height = videoRef.current.clientHeight;
                const scaleX = canvasRef.current.width / videoRef.current.videoWidth;
                const scaleY = canvasRef.current.height / videoRef.current.videoHeight;
                canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                result.detections.forEach((det: Detection) => {
                    const [x1, y1, x2, y2] = det.box;
                    canvasCtx.strokeStyle = '#34C759';
                    canvasCtx.lineWidth = 2;
                    canvasCtx.strokeRect(x1 * scaleX, y1 * scaleY, (x2 - x1) * scaleX, (y2 - y1) * scaleY);
                });
            }
            if (result.pending_id) {
                onConfirmNeeded(camera.id, result.pending_id);
            }
        } catch (error) {
            console.error('Error deteksi:', error);
        }
    };

    useEffect(() => {
        if (fallDetectionEnabled && camera.status === 'active' && stream) {
            detectionInterval.current = setInterval(processFrame, 1000);
        } else {
            if (detectionInterval.current) clearInterval(detectionInterval.current);
            const ctx = canvasRef.current?.getContext('2d');
            ctx?.clearRect(0, 0, canvasRef.current?.width || 0, canvasRef.current?.height || 0);
        }
        return () => {
            if (detectionInterval.current) clearInterval(detectionInterval.current);
        };
    }, [fallDetectionEnabled, camera.status, stream, processFrame]);

    return (
        <div className="card" style={{ margin: '0', display: 'flex', flexDirection: 'column' }}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p style={{ fontWeight: '600' }}>Room {camera.room_number}</p>
                    {resident && <p className="text-sm text-gray-500">{resident.name}</p>}
                </div>
                {/* [KUNCI] Status badge sekarang dinamis berdasarkan 'stream' */}
                <span className={`badge ${stream ? 'badge-success' : 'badge-error'}`}>
                    {stream ? 'Online' : 'Offline'}
                </span>
            </div>
            <div className="relative w-full bg-gray-200 rounded overflow-hidden" style={{ aspectRatio: '16/9', marginTop: 'auto' }}>
                {stream ? (
                    <>
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-gray-500" />
                    </div>
                )}
            </div>
            {camera.status === 'active' && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                    <div className="flex justify-between items-center">
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500' }}>Fall Detection AI</span>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={fallDetectionEnabled} onChange={(e) => setFallDetectionEnabled(e.target.checked)} className="w-4 h-4" disabled={!stream} />
                            <span style={{ fontSize: 'var(--text-sm)' }}>{fallDetectionEnabled ? 'Enabled' : 'Disabled'}</span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}


// --- Komponen Utama dengan Logika Dinamis ---
export function CameraMonitoring({ data, onTriggerAlert }: { data: { camera_info: CameraInfo[], residents: Resident[] }, onTriggerAlert: (residentId: string) => void }) {
    const { camera_info = [], residents = [] } = data;
    const [streams, setStreams] = useState<{ [key: string]: MediaStream | null }>({});
    const [pendingConfirmation, setPendingConfirmation] = useState<{ cameraId: string; trackId: number } | null>(null);
    
    // [KUNCI 1] Gunakan ref untuk menyimpan stream saat ini tanpa memicu render ulang
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const streamsRef = useRef(streams);
    streamsRef.current = streams;

    // [KUNCI 2] Hapus 'streams' dari dependensi useCallback. Gunakan ref untuk cleanup.
    const refreshCameraStreams = useCallback(async () => {
        console.log("Memeriksa ulang perangkat kamera...");
        try {
            // Hentikan stream lama menggunakan ref
            Object.values(streamsRef.current).forEach(stream => stream?.getTracks().forEach(track => track.stop()));

            await navigator.mediaDevices.getUserMedia({ video: true });
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
            
            console.log(`Ditemukan ${videoDevices.length} kamera fisik.`);

            const newStreams: { [key: string]: MediaStream | null } = {};
            const activeCameras = camera_info.filter(c => c.status === 'active');
            
            for (let i = 0; i < activeCameras.length; i++) {
                const uiCamera = activeCameras[i];
                const physicalDevice = videoDevices[i];
                
                if (physicalDevice) {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({
                            video: { deviceId: { exact: physicalDevice.deviceId } }
                        });
                        newStreams[uiCamera.id] = stream;
                    } catch (err) {
                        console.error(`Gagal memulai stream untuk ${uiCamera.room_number}`, err);
                        newStreams[uiCamera.id] = null;
                    }
                } else {
                    newStreams[uiCamera.id] = null;
                }
            }
            setStreams(newStreams);
        } catch (error) {
            console.error("Gagal mengakses perangkat media:", error);
            setStreams({});
        }
    }, [camera_info]); // Sekarang hanya bergantung pada camera_info

    // [KUNCI 3] Hapus 'streams' dari dependensi useEffect
    useEffect(() => {
        refreshCameraStreams();
        navigator.mediaDevices.addEventListener('devicechange', refreshCameraStreams);
        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', refreshCameraStreams);
            Object.values(streamsRef.current).forEach(stream => stream?.getTracks().forEach(track => track.stop()));
        };
    }, [refreshCameraStreams]); // Dependensi sekarang sudah aman

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio('/alarm.mp3'); // Pastikan file ada di /public/alarm.mp3
            audioRef.current.loop = true;
        }

        if (pendingConfirmation) {
            audioRef.current.play().catch(e => console.error("Gagal memutar audio:", e));
        } else {
            audioRef.current.pause();
            audioRef.current.currentTime = 0; // Reset audio ke awal
        }

        // Cleanup saat komponen unmount
        return () => {
            audioRef.current?.pause();
        };
    }, [pendingConfirmation]);

    const handleConfirmNeeded = (cameraId: string, trackId: number) => {
        if (!pendingConfirmation) setPendingConfirmation({ cameraId, trackId });
    };
    const handleConfirmFall = async () => {
        if (!pendingConfirmation) return;
        try {
            // First, confirm with AI backend
            const response = await fetch('http://localhost:5001/api/confirm_fall', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ track_id: pendingConfirmation.trackId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to confirm fall');
            }

            console.log("Fall confirmed successfully with AI backend.");

            // Now create an incident in the main system
            const camera = camera_info.find(c => c.id === pendingConfirmation.cameraId);
            const resident = residents.find(r => r.room_number === camera?.room_number);
            
            if (resident) {
                console.log("🔍 Creating incident for resident:", resident.name, "in room:", camera?.room_number);
                // Use the resident's _id or id for the incident
                const residentId = resident._id || resident.id;
                onTriggerAlert(residentId);
            } else {
                console.error("❌ No resident found for room:", camera?.room_number);
            }

        } catch (error) {
            console.error('Error confirming fall:', error);
        }
        // Stop sound and close modal after action
        setPendingConfirmation(null);
    };
        
    const handleDenyFall = async () => {
        if (!pendingConfirmation) return;
        try {
            // Mengirim request POST ke backend dengan track_id di dalam body
            const response = await fetch('http://localhost:5001/api/deny_fall', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ track_id: pendingConfirmation.trackId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to deny fall');
            }

            console.log("Fall denied successfully.");

        } catch (error) {
            console.error('Error denying fall:', error);
        }
        // Hentikan suara dan tutup modal setelah aksi
        setPendingConfirmation(null);
    };
  
    return (
        <>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#E3F2FD', padding: '16px 24px' }}>
                    <h3 style={{ color: '#1565C0', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Camera style={{ width: '16px', height: '16px' }} />
                        Camera System Status
                    </h3>
                </div>
                <div style={{ padding: '24px' }}>
                    <div className="grid grid-3">
                        {camera_info.map(camera => (
                            <CameraCard 
                                key={camera.id} 
                                camera={camera} 
                                resident={residents.find(r => r.room_number === camera.room_number)}
                                stream={streams[camera.id] || null}
                                onConfirmNeeded={handleConfirmNeeded}
                            />
                        ))}
                    </div>
                </div>
            </div>
            
      {/* Modal Konfirmasi dari CameraMonitoring */}
      {pendingConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="card w-96">
                <h3 className="text-lg font-bold">Konfirmasi Diperlukan!</h3>
                <p className="py-4">
                    Sistem mendeteksi potensi insiden jatuh di 
                    <strong> Room {data.camera_info.find(c => c.id === pendingConfirmation.cameraId)?.room_number}</strong>.
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
    </>
  );
}