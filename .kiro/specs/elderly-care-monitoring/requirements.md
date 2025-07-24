# Requirements Document

## Introduction

The SAFE elderly care monitoring system is a hybrid human+AI platform designed to enhance elderly care in nursing homes through real-time vital sign monitoring, AI-powered fall detection, and emergency response coordination. The system assists caregivers with data collection, trend analysis, and emergency response while maintaining human oversight for all critical decisions. The platform serves three primary user roles: Admins who manage system-wide operations, Caregivers who provide direct patient care, and Family Members who receive notifications and reports.

## Emergency Response Flow Summary

### Normal Vitals Monitoring Flow
1. Caregiver logs in and sees their assigned resident
2. Caregiver inputs vital signs (blood pressure, heart rate)
3. System displays charts and trends
4. Caregiver can request health summary/AI insights
5. Data is logged and visible to Admin

### Emergency Alert Flow
1. **AI Detection**: Automated system detects potential fall via camera
2. **Alert Broadcast**: System sends high-priority alerts to ALL caregivers on duty
3. **Alert Details**: Alert shows resident name, room number, and timestamp
4. **Caregiver Response**: ANY available caregiver can claim the incident
5. **Physical Verification**: Claiming caregiver goes to location and verifies the situation
6. **Confirmation Decision**: Caregiver confirms either:
   - True Emergency → Admin is notified to call hospital
   - False Alarm → Incident logged for AI improvement
7. **Admin Action**: If true emergency, Admin contacts hospital and coordinates response
8. **Family Notification**: Family members receive emergency notifications (only for confirmed true emergencies, not false alarms)
9. **Documentation**: All actions and responses are logged for records

### Timeout Scenario
- If no caregiver responds within countdown period → Admin automatically notified for emergency contact

## Phase 1 Requirements (Prototype Scope)

The following requirements define the core functionality for the capstone project prototype:

## Requirements

### Requirement 1

**User Story:** As an Admin, I want to manage caregiver assignments and view system-wide dashboards, so that I can ensure proper coverage and monitor overall facility health.

#### Acceptance Criteria

1. WHEN an Admin logs into the system THEN the system SHALL display a dashboard showing active alerts, caregiver status, and system-wide analytics
2. WHEN an Admin selects caregiver management THEN the system SHALL allow assignment of one caregiver to one resident for this prototype
3. WHEN an Admin views analytics THEN the system SHALL display trends for average blood pressure and heart rate across all residents
4. WHEN an Admin accesses alert logs THEN the system SHALL show incident history filterable by resident or date
5. WHEN an Admin configures AI settings THEN the system SHALL allow modification of emergency thresholds and notification protocols
6. WHEN an Admin needs to review incidents THEN the system SHALL show camera placeholder information (single camera for prototype, actual feeds in Phase 2)
7. WHEN camera access is requested THEN the system SHALL restrict camera information to Admin role only for privacy and security
8. WHEN a confirmed emergency requires hospital contact THEN the Admin SHALL be responsible for calling the hospital and coordinating emergency response
9. WHEN emergency notifications are triggered THEN the system SHALL alert the Admin with incident details and contact requirements

### Requirement 2

**User Story:** As a Caregiver, I want to monitor my assigned residents' vital signs and receive AI-generated insights, so that I can provide better care and identify health trends.

#### Acceptance Criteria

1. WHEN a Caregiver logs in THEN the system SHALL display their assigned resident (one-to-one assignment for prototype)
2. WHEN a Caregiver accesses their resident's dashboard THEN the system SHALL show a vitals dashboard with historical charts for blood pressure and heart rate
3. WHEN a Caregiver inputs new vital readings THEN the system SHALL validate the data and save it with timestamp
4. WHEN a Caregiver submits vitals THEN the system SHALL offer to generate an AI summary of health trends
5. WHEN a Caregiver requests a health summary THEN the system SHALL display basic trend analysis or placeholder AI-generated insights
6. WHEN vitals are filtered THEN the system SHALL allow viewing by today, this week, or this month

### Requirement 3

**User Story:** As a Caregiver, I want to receive immediate alerts for rare emergency situations and respond appropriately, so that I can ensure resident safety during critical incidents.

#### Acceptance Criteria

1. WHEN a potential fall event is detected (simulated or manually triggered) THEN the system SHALL immediately display high-priority alerts to all caregivers on duty
2. WHEN a rare emergency alert is triggered THEN the system SHALL display resident name, room number, and incident timestamp to all caregivers (camera access restricted to Admin only)
3. WHEN multiple caregivers receive a critical alert THEN the system SHALL allow any caregiver to claim the incident and confirm if it's a true emergency or false alarm
4. WHEN any caregiver claims an incident THEN the system SHALL allow them to physically verify and confirm if it's a true emergency or false alarm from AI detection
5. WHEN the caregiver confirms a true emergency THEN the system SHALL notify the Admin to contact the hospital
6. WHEN the caregiver marks it as false alarm THEN the system SHALL log the incident for AI improvement and close the alert
7. IF no caregiver response occurs within a countdown period THEN the system SHALL automatically notify the Admin for emergency hospital contact
8. WHEN incidents are resolved THEN the system SHALL log the incident details, caregiver response, and Admin actions for record keeping

### Requirement 4

**User Story:** As a Family Member, I want to receive notifications about my loved one's emergencies and health summaries, so that I can stay informed about their wellbeing.

#### Acceptance Criteria

1. WHEN a caregiver confirms a TRUE emergency (not false alarms) THEN the system SHALL log family notification requirements (actual WhatsApp/SMS delivery in Phase 2)
2. WHEN weekly reports are enabled THEN the system SHALL generate health summaries (email delivery in Phase 2)
3. WHEN family members are configured THEN the system SHALL maintain contact lists with preferred notification methods
4. WHEN false alarms occur THEN the system SHALL NOT notify family members to avoid unnecessary panic
5. IF emergency services are contacted THEN family members SHALL be marked for notification (actual delivery in Phase 2)

### Requirement 5

**User Story:** As the System, I want to provide placeholders for future AI integration and external services, so that the frontend can be built with mock data and prepared for future backend connections.

#### Acceptance Criteria

1. WHEN fall detection is simulated THEN the system SHALL trigger alerts using mock data or manual triggers for testing
2. WHEN generating health summaries THEN the system SHALL display placeholder AI-generated content or simple trend calculations
3. WHEN emergency protocols are activated THEN the system SHALL log actions and display confirmation messages (actual external calls to be implemented later)
4. WHEN vitals are displayed THEN the system SHALL support manual data entry with charts and visualizations
5. WHEN notifications are triggered THEN the system SHALL show notification status and log intended recipients (actual delivery to be implemented later)

### Requirement 6

**User Story:** As the System, I want to maintain data integrity and security, so that patient information is protected and audit trails are preserved.

#### Acceptance Criteria

1. WHEN any user accesses the system THEN authentication SHALL be required with role-based permissions
2. WHEN camera feeds are accessed THEN the system SHALL restrict viewing to Admin role only for resident privacy protection
3. WHEN vital signs are recorded THEN the system SHALL maintain immutable logs with timestamps and caregiver identification
3. WHEN incidents occur THEN the system SHALL create detailed audit trails including response times and actions taken
4. WHEN data is stored THEN the system SHALL comply with healthcare privacy regulations
5. WHEN system configurations change THEN the system SHALL log administrative actions with user identification

### Requirement 7

**User Story:** As a user of any role, I want an intuitive interface that works reliably, so that I can efficiently perform my tasks without technical barriers.

#### Acceptance Criteria

1. WHEN caregivers use the vitals dashboard THEN the system SHALL provide real-time chart updates and easy resident selection
2. WHEN rare emergency alerts are triggered THEN the system SHALL display prominent visual indicators that clearly distinguish critical incidents from routine operations
3. WHEN users navigate the interface THEN the system SHALL provide consistent layout with clear role-based menu options
4. WHEN data is being processed THEN the system SHALL provide loading indicators and error handling
5. WHEN the system is offline THEN critical functions SHALL continue with local storage and sync when reconnected

## Phase 2 Requirements (Future Enhancements)

The following features will be implemented in future iterations after the prototype is complete:

### External Integrations
- **WhatsApp/SMS API Integration**: Actual delivery of family notifications via messaging services
- **Hospital/Emergency Services API**: Direct integration with emergency response systems
- **IoT Medical Devices**: Integration with wearable devices for automatic vital sign collection

### Advanced Features
- **Multiple Camera System**: Support for multiple rooms and camera feeds
- **Advanced AI Analytics**: More sophisticated trend analysis and predictive health insights
- **Real-time Data Streaming**: Live vital sign monitoring from connected devices
- **Multi-facility Support**: Scaling to support multiple nursing home locations
- **Advanced Reporting**: Comprehensive health reports and analytics dashboards

### Enhanced User Experience
- **Mobile Application**: Native mobile apps for caregivers and family members
- **Push Notifications**: Real-time mobile notifications for alerts and updates
- **Voice Commands**: Voice-activated system controls for hands-free operation
- **Multilingual Support**: Interface localization for different languages