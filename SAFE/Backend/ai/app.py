import cv2
import numpy as np
import base64
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

# --- Inisialisasi Aplikasi Flask dan Model ---
app = Flask(__name__)
CORS(app)  # Mengizinkan request dari React

# Muat model YOLOv8 Anda
try:
    model = YOLO('yolov8s.pt')
    print("Model YOLOv8 berhasil dimuat.")
except Exception as e:
    print(f"Error memuat model: {e}")
    model = None

# --- Konfigurasi & State Management (Disesuaikan dari Skrip Lama Anda) ---
# GANTI DENGAN KREDENSIAL DARI SKRIP LAMA ANDA
TWILIO_ACCOUNT_SID = "*"
TWILIO_AUTH_TOKEN = "*"
TWILIO_PHONE_NUMBER = "*"
TWILIO_WHATSAPP_NUMBER = 'whatsapp:*'

CAREGIVER_WHATSAPP_NUMBER = 'whatsapp:*'
CAREGIVER_PHONE_LIST = ["*"]
current_caregiver_index = 0

# Variabel State untuk Logika Deteksi
fall_timers = {}
confirmation_pending_for_id = None
alert_made_for_id = set()
FALL_CONFIRMATION_DURATION = 1.0

# --- Fungsi Notifikasi (Disesuaikan dari Skrip Lama Anda) ---
def send_whatsapp_alert(person_id):
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message_body = (
            f"INFO: A fall incident has been confirmed by the admin.\n"
            f"Please check immediately."
        )
        message = client.messages.create(
            from_=TWILIO_WHATSAPP_NUMBER, 
            body=message_body, 
            to=CAREGIVER_WHATSAPP_NUMBER
        )
        print(f"Pesan WhatsApp berhasil dikirim. SID: {message.sid}")
    except TwilioRestException as e:
        print(f"GAGAL mengirim pesan WhatsApp: {e}")

def make_emergency_call():
    global current_caregiver_index
    if not CAREGIVER_PHONE_LIST:
        print("Error: Daftar nomor telepon kosong.")
        return
    
    contact_number = CAREGIVER_PHONE_LIST[current_caregiver_index]
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        # Menggunakan pesan TwiML dari skrip lama Anda (Bahasa Inggris)
        twiml_message = '<Response><Say language="en-US">Warning, the system has detected that someone has fallen. Please check the location immediately.</Say></Response>'
        print(f"Melakukan panggilan darurat ke: {contact_number}...")
        call = client.calls.create(twiml=twiml_message, to=contact_number, from_=TWILIO_PHONE_NUMBER)
        print(f"Panggilan berhasil dimulai. SID: {call.sid}")
    except TwilioRestException as e:
        print(f"GAGAL melakukan panggilan darurat: {e}")
    finally:
        current_caregiver_index = (current_caregiver_index + 1) % len(CAREGIVER_PHONE_LIST)

# --- Endpoint API ---

@app.route('/api/detect', methods=['POST'])
def detect():
    global confirmation_pending_for_id
    if not model:
        return jsonify({"error": "Model tidak dimuat"}), 500

    try:
        data = request.json
        img_data = base64.b64decode(data['image'].split(',')[1])
        frame = cv2.imdecode(np.frombuffer(img_data, np.uint8), cv2.IMREAD_COLOR)
        if frame is None:
            return jsonify({"error": "Gagal decode gambar"}), 400

        results = model.track(frame, persist=True, classes=[0], tracker='bytetrack.yaml')
        
        detections = []
        active_ids_in_frame = set()

        if results[0].boxes is not None and results[0].boxes.id is not None:
            ids = results[0].boxes.id.cpu().numpy()
            boxes = results[0].boxes.xyxy.cpu().numpy()
            
            for track_id, box in zip(ids, boxes):
                x1, y1, x2, y2 = map(int, box)
                current_track_id = int(track_id)
                active_ids_in_frame.add(current_track_id)
                
                h, w = y2 - y1, x2 - x1
                det_status = 'tracking'

                # --- MENGGUNAKAN LOGIKA DETEKSI DARI SKRIP LAMA ANDA ---
                if w > h * 1.25:
                    det_status = 'fallen'
                    if current_track_id not in fall_timers:
                        fall_timers[current_track_id] = time.time()
                    elif time.time() - fall_timers[current_track_id] >= FALL_CONFIRMATION_DURATION:
                        if confirmation_pending_for_id is None and current_track_id not in alert_made_for_id:
                            confirmation_pending_for_id = current_track_id
                            det_status = 'confirm_needed'
                else:
                    if current_track_id in fall_timers: del fall_timers[current_track_id]
                    if current_track_id in alert_made_for_id: alert_made_for_id.remove(current_track_id)
                    if confirmation_pending_for_id == current_track_id: confirmation_pending_for_id = None

                detections.append({"box": [x1, y1, x2, y2], "track_id": current_track_id, "status": det_status})

        if confirmation_pending_for_id and confirmation_pending_for_id not in active_ids_in_frame:
            confirmation_pending_for_id = None

        final_pending_id = int(confirmation_pending_for_id) if confirmation_pending_for_id is not None else None
        return jsonify({"detections": detections, "pending_id": final_pending_id})

    except Exception as e:
        print(f"TERJADI ERROR DI /api/detect: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Terjadi error internal di server.", "details": str(e)}), 500

# Endpoint lain (confirm_fall, deny_fall) tidak perlu diubah
@app.route('/api/confirm_fall', methods=['POST'])
def confirm_fall():
    global confirmation_pending_for_id
    track_id = request.json.get('track_id')
    if track_id != confirmation_pending_for_id: return jsonify({"error": "Invalid ID"}), 400

    print(f"Konfirmasi DITERIMA untuk ID {track_id}.")
    send_whatsapp_alert(track_id)
    make_emergency_call()
    
    alert_made_for_id.add(track_id)
    confirmation_pending_for_id = None
    return jsonify({"message": "Emergency action taken"}), 200

@app.route('/api/deny_fall', methods=['POST'])
def deny_fall():
    global confirmation_pending_for_id
    track_id = request.json.get('track_id')
    if track_id != confirmation_pending_for_id: return jsonify({"error": "Invalid ID"}), 400

    print(f"Konfirmasi DITOLAK untuk ID {track_id}.")
    if track_id in fall_timers: del fall_timers[track_id]
    alert_made_for_id.add(track_id)
    confirmation_pending_for_id = None
    return jsonify({"message": "Alert cancelled"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)