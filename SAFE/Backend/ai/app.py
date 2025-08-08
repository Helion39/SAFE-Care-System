import cv2
import numpy as np
import base64
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

# --- Flask App and Model Initialization ---
app = Flask(__name__)
CORS(app) 

# Load YOLOv8 model
# Source: https://youtu.be/RSOrgvPbZEc?si=MKs_b2iJ5S5744G4
try:
    model = YOLO('yolov8s.pt')
    print("YOLOv8 model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# --- Configuration from Environment Variables ---
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')
TWILIO_WHATSAPP_NUMBER = os.getenv('TWILIO_WHATSAPP_NUMBER')

CAREGIVER_WHATSAPP_NUMBER = os.getenv('CAREGIVER_WHATSAPP_NUMBER')
# Convert the comma-separated string from .env into a list
phone_list_str = os.getenv('CAREGIVER_PHONE_LIST')
CAREGIVER_PHONE_LIST = phone_list_str.split(',') if phone_list_str else []

current_caregiver_index = 0

# --- State variables for detection logic ---
fall_timers = {}
confirmation_pending_for_id = None
alert_made_for_id = set()
FALL_CONFIRMATION_DURATION = 1.0

# --- Notification Functions ---
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
        print(f"WhatsApp message sent successfully. SID: {message.sid}")
    except TwilioRestException as e:
        print(f"FAILED to send WhatsApp message: {e}")

def make_emergency_call():
    global current_caregiver_index
    if not CAREGIVER_PHONE_LIST:
        print("Error: Caregiver phone list is empty.")
        return
    
    contact_number = CAREGIVER_PHONE_LIST[current_caregiver_index]
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        twiml_message = '<Response><Say language="en-US">Warning, the system has detected that someone has fallen. Please check the location immediately.</Say></Response>'
        print(f"Making emergency call to: {contact_number}...")
        call = client.calls.create(twiml=twiml_message, to=contact_number, from_=TWILIO_PHONE_NUMBER)
        print(f"Call initiated successfully. SID: {call.sid}")
    except TwilioRestException as e:
        print(f"FAILED to make emergency call: {e}")
    finally:
        current_caregiver_index = (current_caregiver_index + 1) % len(CAREGIVER_PHONE_LIST)

# --- API Endpoints ---
@app.route('/api/detect', methods=['POST'])
def detect():
    global confirmation_pending_for_id
    if not model:
        return jsonify({"error": "Model not loaded"}), 500

    try:
        data = request.json
        img_data = base64.b64decode(data['image'].split(',')[1])
        frame = cv2.imdecode(np.frombuffer(img_data, np.uint8), cv2.IMREAD_COLOR)
        if frame is None:
            return jsonify({"error": "Failed to decode image"}), 400

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

                # Fall detection logic
                if w > h * 1.25:
                    det_status = 'fallen'
                    if current_track_id not in fall_timers:
                        fall_timers[current_track_id] = time.time()
                    elif time.time() - fall_timers[current_track_id] >= FALL_CONFIRMATION_DURATION:
                        if confirmation_pending_for_id is None and current_track_id not in alert_made_for_id:
                            confirmation_pending_for_id = current_track_id
                            det_status = 'confirm_needed'
                else:
                    # Reset timers and flags if person is no longer detected as fallen
                    if current_track_id in fall_timers: del fall_timers[current_track_id]
                    if current_track_id in alert_made_for_id: alert_made_for_id.remove(current_track_id)
                    if confirmation_pending_for_id == current_track_id: confirmation_pending_for_id = None

                detections.append({"box": [x1, y1, x2, y2], "track_id": current_track_id, "status": det_status})

        # Reset pending confirmation if the person is no longer in the frame
        if confirmation_pending_for_id and confirmation_pending_for_id not in active_ids_in_frame:
            confirmation_pending_for_id = None

        final_pending_id = int(confirmation_pending_for_id) if confirmation_pending_for_id is not None else None
        return jsonify({"detections": detections, "pending_id": final_pending_id})

    except Exception as e:
        print(f"ERROR in /api/detect: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "An internal server error occurred.", "details": str(e)}), 500

@app.route('/api/confirm_fall', methods=['POST'])
def confirm_fall():
    global confirmation_pending_for_id
    
    track_id_from_client = request.json.get('track_id')

    # Convert both IDs to integers for a reliable, type-safe comparison.
    # Assign default values that will never match if one of the IDs is None.
    try:
        client_id = int(track_id_from_client) if track_id_from_client is not None else -1
        server_id = int(confirmation_pending_for_id) if confirmation_pending_for_id is not None else -2
    except (ValueError, TypeError):
        # Handle cases where the client sends a non-numeric track_id
        client_id = -1
        server_id = -2
    
    # Perform the safe comparison
    if client_id != server_id:
        return jsonify({"error": "Invalid ID or request timed out"}), 400
    
    print(f"Confirmation received for ID {client_id}.")
    send_whatsapp_alert(client_id)
    make_emergency_call()
    
    alert_made_for_id.add(client_id)
    confirmation_pending_for_id = None
    return jsonify({"message": "Emergency action taken"}), 200

@app.route('/api/deny_fall', methods=['POST'])
def deny_fall():
    global confirmation_pending_for_id
    
    # This comparison can also be made safer like in confirm_fall if needed,
    # but it's less critical as it doesn't trigger alerts.
    track_id = request.json.get('track_id')
    if str(track_id) != str(confirmation_pending_for_id): # A simple string comparison is also safe
         return jsonify({"error": "Invalid ID"}), 400

    print(f"Confirmation DENIED for ID {track_id}.")
    if track_id in fall_timers: del fall_timers[track_id]
    
    # Add to alert_made_for_id to prevent immediate re-alerting for the same person
    alert_made_for_id.add(track_id)
    confirmation_pending_for_id = None
    return jsonify({"message": "Alert cancelled"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)