# SAFE Care System

Is a fall-detection prototype project that aims to help families and caregivers monitor elderly people remotely using non-intrusive AI technology. The project leverages computer vision (YOLO/Pose Estimation) to detect fall incidents and send emergency alerts instantly.

## 🏥 Features

### Core Functionality
- **Real-time Vital Signs Monitoring** - Track blood pressure, heart rate, temperature, and oxygen saturation 
- **AI Fall Detection** - Computer vision-based fall detection with camera monitoring
- **Emergency Response System** - Automated alerts and incident management
- **Family Portal** - Secure access for family members to view care information
- **Staff Management** - Role-based access for administrators and caregivers
- **Analytics Dashboard** - Health trends and care analytics

### User Roles
- **Admin** - Full system management, user creation, resident management
- **Caregiver** - Resident care, vitals recording, incident response
- **Family** - View loved one's care information and vitals history

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB
- Python 3.8+ (for AI components)
- Webcam/Camera (for fall detection)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd SAFE-Care-System
```

2. **Backend Setup**
```bash
cd SAFE/Backend
npm install
cp .env.example .env
# Configure your MongoDB URI and other environment variables
npm start
```

3. **Frontend Setup**
```bash
cd SAFE/Frontend
npm init -y
npm install
npm start
```

4. **AI Fall Detection Setup**
```bash
cd SAFE/Backend/ai
pip install -r requirements.txt
python app.py
```

## 🔧 Configuration

### Environment Variables (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/safe_care_system

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRE=30d

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Google OAuth (for family portal)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Twilio (for emergency notifications)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

## 📱 Usage

### Default Login Credentials
- **Admin**: `admin` / `admin123`
- **Caregiver**: `caregiver1` / `password123`

### Initial Setup
1. Start the backend server
2. Run database seeding: `node scripts/check-and-create-admin.js`
3. Add residents and caregivers through admin dashboard
4. Configure camera monitoring for fall detection

## 🏗️ Architecture

```
SAFE-Care-System/
├── SAFE/
│   ├── Backend/           # Node.js/Express API
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   └── utils/
│   │   ├── scripts/       # Database utilities
│   │   └── ai/           # Python AI services
│   └── Frontend/         # React.js application
│       ├── src/
│       │   ├── components/
│       │   ├── services/
│       │   ├── hooks/
│       │   └── styles/
│       └── public/
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Staff login
- `POST /api/auth/family-login` - Family member login
- `GET /api/auth/google` - Google OAuth for families

### Core Resources
- `GET /api/residents` - List residents
- `POST /api/vitals` - Record vital signs
- `GET /api/incidents` - View incidents
- `POST /api/assignments` - Create caregiver assignments

### AI Services
- `POST /api/detect` - Fall detection analysis
- `POST /api/confirm_fall` - Confirm fall incident
- `POST /api/deny_fall` - Dismiss false alarm

## 🤖 AI Fall Detection

The system uses YOLOv8 for real-time person detection and fall analysis:

1. **Camera Monitoring** - Continuous video stream analysis
2. **Person Detection** - Track individuals in care areas
3. **Fall Analysis** - Detect unusual posture/position changes
4. **Alert Generation** - Immediate notifications to caregivers
5. **Confirmation System** - Manual verification to reduce false alarms

## 👨‍👩‍👧‍👦 Family Portal

Family members can access care information through:
- **Google OAuth Login** - Secure authentication
- **Resident Dashboard** - View vitals and care updates
- **Incident History** - Emergency response records
- **Medical Information** - Conditions and care notes

## 📊 Database Schema

### Key Collections
- **Users** - Staff accounts (admin, caregivers)
- **Residents** - Elderly care recipients
- **Vitals** - Health measurements and trends
- **Incidents** - Emergency events and responses
- **Assignments** - Caregiver-resident relationships

## 🛠️ Development

### Database Scripts
```bash
# Create admin user
node scripts/check-and-create-admin.js

# Add sample data
node scripts/add-comprehensive-residents.js
node scripts/add-comprehensive-vitals.js

# Database maintenance
node scripts/debug-database.js
```

### Testing
```bash
# Backend tests
cd SAFE/Backend
npm test

# Frontend tests  
cd SAFE/Frontend
npm test
```

## 🚨 Emergency Response Flow

1. **Detection** - AI camera or manual report
2. **Alert** - Real-time notification to caregivers
3. **Claim** - Caregiver responds to incident
4. **Assessment** - On-site evaluation
5. **Resolution** - Emergency services or false alarm
6. **Documentation** - Incident logging and family notification

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Rate limiting
- Secure password hashing
- CORS protection
- Helmet security headers

## 📈 Monitoring & Analytics

- Real-time vital signs tracking
- Health trend analysis
- Incident response metrics
- Caregiver workload distribution
- System performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in `/docs`

## 🙏 Acknowledgments

- YOLOv8 for computer vision capabilities
- MongoDB for data storage
- React.js for user interface
- Express.js for backend API
- Twilio for emergency communications