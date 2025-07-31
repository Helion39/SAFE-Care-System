# SAFE Care UI Design Brief

## Users
**Admin**: Facility managers - system oversight, user/resident management
**Caregiver**: Nurses - direct patient care, vitals, emergency response

## Key Screens

### Login
Simple form: username/password → role-based dashboard

### Admin Dashboard
```
[Alerts: 3] [Caregivers: 12] [Residents: 45] [System: 98%]
🚨 Active Incidents
- Room 204 Fall Alert [CLAIM] [CALL HOSPITAL]
Tabs: [Users] [Residents] [Incidents] [Analytics] [Cameras]
[+ Add Caregiver] [Test Emergency]
```

### Caregiver Dashboard  
```
🚨 EMERGENCY - Room 204 [30s] [CLAIM]
👤 Your Resident: Robert Chen - Room 102
[📊 Vitals] [➕ Add Vitals] [📋 Summary]
```

### Vitals Entry
Form: BP, Heart Rate, Temp, O2 + validation ranges
History table below

### Emergency Alert (All Screens)
```
🚨 FALL DETECTED - Room 204 [25s]
Mary Johnson - 2 min ago
[CLAIM] [DETAILS] [CALL ADMIN]
```

## Design
- Flat, minimal healthcare theme
- Red alerts, blue actions, green success
- Mobile-first responsive
- Large touch targets (44px+)
- High contrast accessibility