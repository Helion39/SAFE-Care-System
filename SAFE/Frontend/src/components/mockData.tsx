// mockData.tsx

export interface User {
  id: number;
  name: string;
  role: 'admin' | 'caregiver';
  assigned_resident_id: number | null;
}

export interface Resident {
  id: number;
  name: string;
  room_number: string;
  assigned_caregiver_id: number | null;
  age: number;
  medical_conditions: string[];
}

export interface Vital {
  id: number;
  resident_id: number;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  timestamp: string;
  caregiver_id: number;
}

export interface Incident {
  id: number;
  resident_id: number;
  detection_time: string;
  claimed_by: number;
  status: 'resolved' | 'pending';
  resolution: 'true_emergency' | 'false_alarm' | null;
  admin_action: string | null;
  resolved_time: string;
  resident_name: string;
  room_number: string;
}

export interface CameraInfo {
  id: number;
  room_number: string;
  status: 'active' | 'maintenance_required' | 'offline';
  last_checked: string;
}

export interface MockData {
  users: User[];
  residents: Resident[];
  vitals: Vital[];
  incidents: Incident[];
  camera_info: CameraInfo[];
}

export const mockData: MockData = {
  users: [
    { id: 1, name: "Dr. Sarah Johnson", role: "admin", assigned_resident_id: null },
    { id: 2, name: "Maria Garcia", role: "caregiver", assigned_resident_id: 1 },
    { id: 3, name: "James Wilson", role: "caregiver", assigned_resident_id: 2 }
  ],
  residents: [
    {
      id: 1,
      name: "John Doe",
      room_number: "101",
      assigned_caregiver_id: 2,
      age: 78,
      medical_conditions: ["Hypertension", "Diabetes Type 2"]
    },
    {
      id: 2,
      name: "Mary Smith",
      room_number: "102",
      assigned_caregiver_id: 3,
      age: 82,
      medical_conditions: ["Arthritis", "Heart Disease"]
    },
    {
      id: 3,
      name: "Robert Brown",
      room_number: "103",
      assigned_caregiver_id: null,
      age: 75,
      medical_conditions: ["COPD"]
    }
  ],
  vitals: [
    {
      id: 1,
      resident_id: 1,
      systolic_bp: 140,
      diastolic_bp: 90,
      heart_rate: 78,
      timestamp: "2025-01-23T08:00:00Z",
      caregiver_id: 2
    },
    {
      id: 2,
      resident_id: 1,
      systolic_bp: 138,
      diastolic_bp: 88,
      heart_rate: 82,
      timestamp: "2025-01-23T14:00:00Z",
      caregiver_id: 2
    },
    {
      id: 3,
      resident_id: 1,
      systolic_bp: 142,
      diastolic_bp: 92,
      heart_rate: 76,
      timestamp: "2025-01-22T08:00:00Z",
      caregiver_id: 2
    },
    {
      id: 4,
      resident_id: 1,
      systolic_bp: 136,
      diastolic_bp: 86,
      heart_rate: 80,
      timestamp: "2025-01-22T14:00:00Z",
      caregiver_id: 2
    },
    {
      id: 5,
      resident_id: 1,
      systolic_bp: 144,
      diastolic_bp: 94,
      heart_rate: 84,
      timestamp: "2025-01-21T08:00:00Z",
      caregiver_id: 2
    },
    {
      id: 6,
      resident_id: 2,
      systolic_bp: 158,
      diastolic_bp: 96,
      heart_rate: 92,
      timestamp: "2025-01-23T08:30:00Z",
      caregiver_id: 3
    },
    {
      id: 7,
      resident_id: 2,
      systolic_bp: 154,
      diastolic_bp: 94,
      heart_rate: 88,
      timestamp: "2025-01-23T14:30:00Z",
      caregiver_id: 3
    },
    {
      id: 8,
      resident_id: 2,
      systolic_bp: 160,
      diastolic_bp: 98,
      heart_rate: 90,
      timestamp: "2025-01-22T08:30:00Z",
      caregiver_id: 3
    }
  ],
  incidents: [
    {
      id: 1,
      resident_id: 1,
      detection_time: "2025-01-22T15:30:00Z",
      claimed_by: 2,
      status: "resolved",
      resolution: "false_alarm",
      admin_action: null,
      resolved_time: "2025-01-22T15:35:00Z",
      resident_name: "John Doe",
      room_number: "101"
    },
    {
      id: 2,
      resident_id: 2,
      detection_time: "2025-01-21T09:15:00Z",
      claimed_by: 3,
      status: "resolved",
      resolution: "true_emergency",
      admin_action: "Hospital contacted - Ambulance dispatched",
      resolved_time: "2025-01-21T09:25:00Z",
      resident_name: "Mary Smith",
      room_number: "102"
    }
  ],
  camera_info: [
    {
      id: 1,
      room_number: "101",
      status: "active",
      last_checked: "2025-01-23T12:00:00Z"
    },
    {
      id: 2,
      room_number: "102",
      status: "active",
      last_checked: "2025-01-23T12:00:00Z"
    },
    {
      id: 3,
      room_number: "103",
      status: "maintenance_required",
      last_checked: "2025-01-23T08:00:00Z"
    }
  ]
};

// Initialize mock data in localStorage if not present
export const initializeMockData = (): void => {
  if (!localStorage.getItem('careSystemData')) {
    localStorage.setItem('careSystemData', JSON.stringify(mockData));
  }
};

// Health Summary Generator
export const generateHealthSummary = (vitals: Vital[], residentName: string): string => {
  if (vitals.length === 0) {
    return `No recent vital signs data available for ${residentName}.`;
  }

  const recent = vitals.slice(0, 3); // Ambil 3 terbaru
  const avgSystolic = recent.reduce((sum, v) => sum + v.systolic_bp, 0) / recent.length;
  const avgDiastolic = recent.reduce((sum, v) => sum + v.diastolic_bp, 0) / recent.length;
  const avgHeartRate = recent.reduce((sum, v) => sum + v.heart_rate, 0) / recent.length;

  let summary = `Health Summary for ${residentName}:\n\n`;

  if (avgSystolic > 140 || avgDiastolic > 90) {
    summary += `🔴 High Blood Pressure: ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg\n`;
  } else if (avgSystolic > 130 || avgDiastolic > 80) {
    summary += `🟡 Elevated BP: ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg\n`;
  } else {
    summary += `✅ Normal BP: ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg\n`;
  }

  if (avgHeartRate > 90) {
    summary += `🔴 Elevated Heart Rate: ${Math.round(avgHeartRate)} bpm\n`;
  } else if (avgHeartRate < 60) {
    summary += `🟡 Low Heart Rate: ${Math.round(avgHeartRate)} bpm\n`;
  } else {
    summary += `✅ Normal Heart Rate: ${Math.round(avgHeartRate)} bpm\n`;
  }

  const trend = recent[0].systolic_bp - recent[2].systolic_bp;
  if (trend > 10) {
    summary += `📈 Upward BP Trend\n`;
  } else if (trend < -10) {
    summary += `📉 Downward BP Trend\n`;
  } else {
    summary += `📊 Stable BP\n`;
  }

  return summary;
};
