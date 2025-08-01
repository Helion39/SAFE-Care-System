# SAFE Elderly Care Monitoring System - Prototype Requirements

## Project Overview

Build a web application prototype for elderly care monitoring in nursing homes. This is a hybrid human+AI system that assists caregivers with emergency response while maintaining human oversight for all critical decisions.

## User Roles

### Admin (System Manager)
- Manages caregiver-to-resident assignments (1:1 for prototype)
- Views system-wide dashboard and incident logs
- Has exclusive access to camera information
- Responsible for calling hospital when emergencies are confirmed
- Configures system settings and thresholds

### Caregiver (Primary User)
- Assigned to one specific resident
- Inputs vital signs manually (blood pressure, heart rate)
- Receives emergency alerts and can claim/respond to incidents
- Generates AI-powered health summaries for reports
- Verifies if AI-detected incidents are true emergencies or false alarms

## Core User Flows

### Flow 1: Normal Vitals Monitoring
```
1. Caregiver logs in → sees their assigned resident
2. Caregiver clicks "Log Vitals" → enters blood pressure & heart rate
3. System validates data → saves with timestamp
4. Caregiver clicks "Generate Summary" → AI analyzes trends
5. System displays health insights → "BP stable, HR slightly elevated"
6. Data appears on charts → Admin can view in dashboard
```

### Flow 2: Emergency Response (Critical Path)
```
1. AI detects potential fall → triggers alert system
2. Alert broadcasts to ALL caregivers → shows "EMERGENCY: John Doe, Room 101, 2:30 PM"
3. Any caregiver clicks "Claim Incident" → goes to verify physically
4. Caregiver assesses situation → chooses "True Emergency" or "False Alarm"

If TRUE EMERGENCY:
5a. System notifies Admin → "Confirmed emergency - call hospital"
5b. Admin calls hospital → logs action in system
5c. Incident logged as resolved

If FALSE ALARM:
5a. System logs incident → for AI improvement
5b. Alert closes → no further action needed
```

### Flow 3: Admin Management
```
1. Admin logs in → sees dashboard with alerts, caregiver status, analytics
2. Admin clicks "Manage Assignments" → assigns Caregiver A to Resident B
3. Admin views "Incident History" → filters by date/resident
4. Admin accesses "Camera Info" → sees "Room 101 - Camera Active"
5. Admin configures "Alert Settings" → sets countdown timers, thresholds
```

## Key Features to Build

### Authentication & Authorization
- Login system with role-based access (Admin, Caregiver)
- Admin-only access to camera information and system settings
- Caregiver access limited to their assigned resident

### Vitals Management
- Manual input form for blood pressure (systolic/diastolic) and heart rate
- Data validation and timestamp recording
- Historical charts showing vitals over time with specific dates
- AI summary generation for trend analysis and report writing

### Emergency Alert System
- Simulated fall detection (manual trigger for testing)
- Real-time alerts to all caregivers with resident location
- Incident claiming mechanism to prevent duplicate responses
- True/False emergency confirmation workflow
- Countdown timer for automatic admin notification if no response

### Admin Dashboard
- System-wide view of active alerts and caregiver status
- Incident history with filtering capabilities
- Analytics showing vital sign trends across residents
- Camera information display (placeholder for single camera)
- User management for caregiver assignments

### Data Logging & Audit Trail
- All vital sign entries with timestamps and caregiver ID
- Complete incident logs including response times and actions
- Admin actions and system configuration changes
- Family notification requirements (logged for future delivery)

## Technical Specifications

### Data to Store
- **Users**: ID, name, role, assigned_resident_id
- **Residents**: ID, name, room_number, assigned_caregiver_id
- **Vitals**: ID, resident_id, systolic_bp, diastolic_bp, heart_rate, timestamp, caregiver_id
- **Incidents**: ID, resident_id, detection_time, claimed_by, status, resolution, admin_action


### UI Requirements
- Responsive web interface
- Clear visual distinction for emergency alerts (red banners, prominent buttons)
- Charts for vital sign visualization with date/time labels
- Role-based navigation menus
- Loading indicators and error handling
- Consistent layout across all pages

### Frontend Implementation vs Placeholders

**Real Frontend Features:**
- User interface components (forms, buttons, charts, navigation)
- Role-based page routing and conditional rendering
- Form validation and data display
- Chart libraries showing mock data
- Real-time UI updates (alerts, notifications, timers)
- Local data storage (localStorage or session storage)

**Placeholder/Mock Elements:**
- **AI Fall Detection**: Manual "Trigger Alert" button instead of camera AI
- **AI Health Summary**: Pre-written responses or simple trend text
- **Database**: Mock data arrays instead of real database calls
- **Authentication**: Simple role switching instead of real login system
- **Hospital Contact**: Success message instead of actual phone integration
- **Camera System**: Text display "Camera: Room 101 - Active" instead of video feeds
- **External APIs**: All external integrations return mock success responses

## Success Criteria

The prototype should demonstrate:
1. Complete emergency response workflow from detection to resolution
2. Proper role-based access control and user management
3. Functional vitals tracking with historical data and AI insights
4. Clear audit trail of all actions and decisions
5. Intuitive interface that healthcare workers could realistically use

## Out of Scope (Future Phases)
- Actual WhatsApp/SMS integration
- Real camera feed integration
- Multiple facility support
- Mobile applications
- IoT device connections
- Advanced analytics and reporting