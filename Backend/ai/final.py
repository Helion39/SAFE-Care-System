import cv2
from ultralytics import YOLO
import cvzone
import platform
import time
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

# Import Winsound for Windows Alert Sounds
try:
    if platform.system() == "Windows":
        import winsound
except ImportError:
    print("Winsound module not found. Alert sounds will not work on non-Windows OS.")
    winsound = None

# Notification & Emergency Call Configuration ---
TWILIO_ACCOUNT_SID = "****"
TWILIO_AUTH_TOKEN = "****"
TWILIO_PHONE_NUMBER = "***"
TWILIO_WHATSAPP_NUMBER = 'whatsapp:****'

# Emergency Contact List
CAREGIVER_WHATSAPP_NUMBER = 'whatsapp:****'
# List of caregiver phone numbers to be called in rotation
CAREGIVER_PHONE_LIST = [
    "***"
]
current_caregiver_index = 0

# Load model
model = YOLO('yolov8s.pt')
names = model.names

cap = cv2.VideoCapture(1) 

if not cap.isOpened():
    print("Error: Could not open camera.")
    exit()

# Variables for Admin Confirmation Logic
fall_timers = {}
confirmation_pending_for_id = None
alert_made_for_id = set()
FALL_CONFIRMATION_DURATION = 1.0 
ALERT_COOLDOWN = 10.0
last_alert_time = 0

# Alert & Call Functions
def play_alert_sound():
    """Plays a short 'beep' sound for admin notification."""
    if winsound:
        winsound.Beep(1500, 200)
    else:
        print("\a", end='', flush=True)

def send_whatsapp_alert(person_id):
    """Sends a fall alert message via WhatsApp."""
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
    """Makes a voice call to the next caregiver in rotation."""
    global current_caregiver_index
    if not CAREGIVER_PHONE_LIST:
        print("Error: Caregiver number list is empty.")
        return

    contact_number = CAREGIVER_PHONE_LIST[current_caregiver_index]
    
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        twiml_message = '<Response><Say language="en-US">Warning, the system has detected that someone has fallen. Please check the location immediately.</Say></Response>'
        print(f"\nMaking an emergency call to the next caregiver: {contact_number}...")
        call = client.calls.create(twiml=twiml_message, to=contact_number, from_=TWILIO_PHONE_NUMBER)
        print(f"Call initiated successfully. Call SID: {call.sid}")
    except TwilioRestException as e:
        print(f"\nFAILED to make emergency call. Message from Twilio: {e}")
    finally:
        # Move the index to the next caregiver for the subsequent call
        current_caregiver_index = (current_caregiver_index + 1) % len(CAREGIVER_PHONE_LIST)

# Main Loop
while True:
    ret, frame = cap.read()
    if not ret: break

    frame = cv2.resize(frame, (1020, 600))
    results = model.track(frame, persist=True, classes=[0], tracker='bytetrack.yaml')
    
    active_ids_in_frame = set()
    if results[0].boxes.id is not None:
        ids = results[0].boxes.id.cpu().numpy().astype(int)
        active_ids_in_frame.update(ids)

        for track_id, box, class_id in zip(ids, results[0].boxes.xyxy.cpu().numpy().astype(int), results[0].boxes.cls.int().cpu().tolist()):
            x1, y1, x2, y2 = box
            name = names[class_id]
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cvzone.putTextRect(frame, f'{name} ID: {track_id}', (x1, y1), 1, 1)
            
            h, w = y2 - y1, x2 - x1
            
            if 'person' in name and w > h:
                cvzone.putTextRect(frame, 'FALLEN', (x1, y2 + 12), 1, 1, colorR=(0, 0, 255))
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                
                if track_id not in fall_timers:
                    fall_timers[track_id] = time.time()
                
                elif time.time() - fall_timers[track_id] >= FALL_CONFIRMATION_DURATION:
                    if confirmation_pending_for_id is None and track_id not in alert_made_for_id:
                        confirmation_pending_for_id = track_id
            else:
                if track_id in fall_timers: del fall_timers[track_id]
                if track_id in alert_made_for_id: alert_made_for_id.remove(track_id)
                if confirmation_pending_for_id == track_id: confirmation_pending_for_id = None

    if confirmation_pending_for_id and confirmation_pending_for_id not in active_ids_in_frame:
        confirmation_pending_for_id = None

    if confirmation_pending_for_id is not None:
        play_alert_sound()
        msg = f"Confirm Emergency for ID {confirmation_pending_for_id}? (Y/N)"
        cvzone.putTextRect(frame, msg, (150, 50), scale=1.5, thickness=2, colorR=(0, 0, 255))

    cv2.imshow("RGB", frame)
    key = cv2.waitKey(1) & 0xFF

    # Confirmation Key Logic
    if confirmation_pending_for_id is not None:
        if key == ord('y'):
            print("Confirmation ACCEPTED. Taking emergency action...")
            send_whatsapp_alert(confirmation_pending_for_id)
            make_emergency_call()
            
            alert_made_for_id.add(confirmation_pending_for_id)
            confirmation_pending_for_id = None
        elif key == ord('n'):
            print("Confirmation DENIED. Alert cancelled.")
            if confirmation_pending_for_id in fall_timers:
                 del fall_timers[confirmation_pending_for_id]
            alert_made_for_id.add(confirmation_pending_for_id)
            confirmation_pending_for_id = None

    if key == 27: # Exit with ESC key
        break

cap.release()
cv2.destroyAllWindows()