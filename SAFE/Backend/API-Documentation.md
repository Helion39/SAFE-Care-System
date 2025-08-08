# SAFE Care System - API Documentation

## 📋 Overview

SAFE Care System menyediakan RESTful API untuk manajemen perawatan lansia dengan deteksi jatuh berbasis AI. API ini mendukung autentikasi JWT, role-based access control, dan real-time monitoring.

## 🔧 Base URLs

- **Backend API**: `http://localhost:5000`
- **AI Service**: `http://localhost:5001`

## 🔐 Authentication

### JWT Token Authentication
Semua endpoint yang dilindungi memerlukan Bearer token di header:
```
Authorization: Bearer <your_jwt_token>
```

### User Roles
- **Admin**: Akses penuh ke semua fitur
- **Caregiver**: Akses untuk perawatan dan monitoring
- **Family**: Akses terbatas untuk melihat data keluarga

## 📚 API Endpoints

### 🔐 Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/login` | Staff login | Public |
| POST | `/api/auth/family-login` | Family login | Public |
| GET | `/api/auth/google` | Google OAuth | Public |
| POST | `/api/auth/register` | Register user | Admin |
| GET | `/api/auth/me` | Get current user | Protected |
| POST | `/api/auth/refresh` | Refresh token | Public |
| POST | `/api/auth/logout` | Logout | Protected |
| PUT | `/api/auth/profile` | Update profile | Protected |
| PUT | `/api/auth/password` | Change password | Protected |

### 👥 Residents Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/residents` | Get all residents | Protected |
| GET | `/api/residents/:id` | Get single resident | Protected |
| POST | `/api/residents` | Create resident | Admin |
| PUT | `/api/residents/:id` | Update resident | Admin |
| DELETE | `/api/residents/:id` | Delete resident | Admin |
| GET | `/api/residents/search` | Search residents | Protected |
| GET | `/api/residents/unassigned` | Get unassigned residents | Admin |
| GET | `/api/residents/stats` | Get resident statistics | Admin |
| GET | `/api/residents/check-room/:roomNumber` | Check room availability | Admin |

### 💊 Vitals Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/vitals` | Get all vitals | Protected |
| GET | `/api/vitals/resident/:id` | Get resident vitals | Protected |
| POST | `/api/vitals` | Record vitals | Caregiver |
| POST | `/api/vitals/batch` | Batch record vitals | Caregiver |
| PUT | `/api/vitals/:id` | Update vitals | Caregiver |
| GET | `/api/vitals/recent` | Get recent vitals | Protected |
| GET | `/api/vitals/overdue` | Get overdue vitals | Protected |
| GET | `/api/vitals/stats` | Get vitals statistics | Admin |

### 🚨 Incidents Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/incidents` | Get all incidents | Protected |
| GET | `/api/incidents/active` | Get active incidents | Protected |
| POST | `/api/incidents` | Create incident | Protected |
| PUT | `/api/incidents/:id/claim` | Claim incident | Caregiver |
| PUT | `/api/incidents/:id/resolve` | Resolve incident | Protected |
| GET | `/api/incidents/overdue` | Get overdue incidents | Admin |
| GET | `/api/incidents/stats` | Get incident statistics | Admin |
| POST | `/api/incidents/simulate-fall` | Simulate fall detection | Admin |

### 👨⚕️ User Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/users` | Get all users | Admin |
| GET | `/api/users/:id` | Get single user | Admin |
| GET | `/api/users/caregivers` | Get all caregivers | Protected |
| POST | `/api/users/create-caregiver` | Create caregiver | Admin |
| POST | `/api/users/bulk-create-caregivers` | Bulk create caregivers | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |
| PUT | `/api/users/:id/reset-password` | Reset user password | Admin |
| PUT | `/api/users/:id/toggle-status` | Toggle user status | Admin |
| GET | `/api/users/stats` | Get user statistics | Admin |

### 📋 Assignments Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/assignments` | Get all assignments | Protected |
| GET | `/api/assignments/caregiver/:id` | Get caregiver assignments | Protected |
| POST | `/api/assignments` | Create assignment | Admin |
| PUT | `/api/assignments/:id` | Update assignment | Admin |
| DELETE | `/api/assignments/:id` | Delete assignment | Admin |
| POST | `/api/assignments/:id/transfer` | Transfer assignment | Admin |
| GET | `/api/assignments/workload` | Get caregiver workload | Admin |
| GET | `/api/assignments/stats` | Get assignment statistics | Admin |

### 📊 Analytics & Reports

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/analytics/dashboard` | Get dashboard analytics | Protected |
| GET | `/api/analytics/vitals-trends` | Get vitals trends | Protected |
| GET | `/api/analytics/resident-health` | Get resident health scores | Protected |
| POST | `/api/reports/generate` | Generate report | Admin |
| POST | `/api/reports/schedule` | Schedule report | Admin |
| GET | `/api/reports/scheduled` | Get scheduled reports | Admin |
| GET | `/api/reports/export/:reportId` | Export report | Admin |

### 🤖 AI Fall Detection

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/detect` | Fall detection analysis | Public |
| POST | `/api/confirm_fall` | Confirm fall incident | Public |
| POST | `/api/deny_fall` | Deny fall incident | Public |

## 📝 Request/Response Examples

### Login Request
```json
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

### Login Response
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ecb74b24a1234567890a",
    "name": "Administrator",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Create Resident Request
```json
POST /api/residents
{
  "name": "John Doe",
  "age": 75,
  "gender": "male",
  "roomNumber": "101",
  "medicalConditions": ["Diabetes", "Hypertension"],
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "Daughter",
    "phone": "+1234567890",
    "email": "jane@example.com"
  },
  "familyEmails": ["jane@example.com"],
  "admissionDate": "2024-01-15",
  "notes": "Requires assistance with mobility"
}
```

### Record Vitals Request
```json
POST /api/vitals
{
  "residentId": "60d5ecb74b24a1234567890b",
  "bloodPressure": {
    "systolic": 120,
    "diastolic": 80
  },
  "heartRate": 72,
  "temperature": 36.5,
  "oxygenSaturation": 98,
  "notes": "Patient feeling well today"
}
```

### Create Incident Request
```json
POST /api/incidents
{
  "residentId": "60d5ecb74b24a1234567890b",
  "type": "fall",
  "severity": "high",
  "description": "Fall detected by AI system",
  "location": "Room 101",
  "detectedBy": "AI System"
}
```

### Fall Detection Request
```json
POST /api/detect
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```

## 🔍 Query Parameters

### Pagination
```
?page=1&limit=10
```

### Filtering
```
?status=active&role=caregiver&search=john
```

### Date Range
```
?startDate=2024-01-01&endDate=2024-01-31
```

### Sorting
```
?sortBy=createdAt&sortOrder=desc
```

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Required fields are missing",
  "details": {
    "name": "Name is required",
    "email": "Valid email is required"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Access denied. Admin role required."
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

## 🚀 Getting Started with Postman

1. **Import Collection**: Import file `SAFE-Care-API-Documentation.json` ke Postman
2. **Set Environment Variables**:
   - `baseUrl`: `http://localhost:5000`
   - `aiUrl`: `http://localhost:5001`
   - `token`: (akan diisi otomatis setelah login)

3. **Login**: Gunakan endpoint "Staff Login" untuk mendapatkan token
4. **Set Token**: Copy token dari response dan set ke environment variable
5. **Test Endpoints**: Semua endpoint sudah siap digunakan

## 🔧 Environment Setup

### Development
```env
MONGODB_URI=mongodb://localhost:27017/safe_care_system
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
PORT=5000
NODE_ENV=development
```

### Production
```env
MONGODB_URI=mongodb://your-production-uri
JWT_SECRET=your_production_jwt_secret
JWT_EXPIRE=24h
PORT=5000
NODE_ENV=production
```

## 📱 Rate Limiting

API menggunakan rate limiting untuk mencegah abuse:
- **General endpoints**: 100 requests per 15 minutes
- **Auth endpoints**: 5 requests per 15 minutes
- **AI endpoints**: 50 requests per minute

## 🔒 Security Headers

API menggunakan security headers berikut:
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling
- **Input Validation**: Request sanitization

## 📞 Support

Untuk bantuan dan pertanyaan:
- Buat issue di repository
- Hubungi tim development
- Periksa dokumentasi di `/docs`

## 🔄 API Versioning

Saat ini menggunakan v1. Untuk versi mendatang:
- `/api/v2/...` untuk breaking changes
- Backward compatibility untuk v1

## 📈 Monitoring

API menyediakan health check endpoint:
```
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": "2h 30m 45s",
  "database": "connected",
  "ai_service": "connected"
}
```