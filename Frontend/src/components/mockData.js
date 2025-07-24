// Mock data structure for the elderly care monitoring system
export const mockData = {
  users: [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      role: "admin",
      assigned_resident_id: null
    },
    {
      id: 2,
      name: "Maria Garcia",
      role: "caregiver",
      assigned_resident_id: 1
    },
    {
      id: 3,
      name: "James Wilson",
      role: "caregiver", 
      assigned_resident_id: 2
    }
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
    // John Doe (ID: 1) - Recent vitals
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
    // Mary Smith (ID: 2) - Recent vitals
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

export const initializeMockData = () => {
  if (!localStorage.getItem('careSystemData')) {
    localStorage.setItem('careSystemData', JSON.stringify(mockData));
  }
};

// AI-generated health summaries based on vitals trends
export const generateHealthSummary = (vitals, residentName) => {
  if (vitals.length === 0) {
    return "No recent vital signs data available.";
  }

  const recent = vitals.slice(0, 3);
  const avgSystolic = recent.reduce((sum, v) => sum + v.systolic_bp, 0) / recent.length;
  const avgDiastolic = recent.reduce((sum, v) => sum + v.diastolic_bp, 0) / recent.length;
  const avgHeartRate = recent.reduce((sum, v) => sum + v.heart_rate, 0) / recent.length;

  let summary = `Health Summary for ${residentName}:\n\n`;
  
  // Blood pressure analysis
  if (avgSystolic > 140 || avgDiastolic > 90) {
    summary += "🔴 ELEVATED BLOOD PRESSURE: Recent readings show hypertension (avg: " + 
               Math.round(avgSystolic) + "/" + Math.round(avgDiastolic) + 
               " mmHg). Consider medication review.\n\n";
  } else if (avgSystolic > 130 || avgDiastolic > 80) {
    summary += "🟡 BORDERLINE BP: Readings trending toward hypertension (avg: " + 
               Math.round(avgSystolic) + "/" + Math.round(avgDiastolic) + 
               " mmHg). Monitor closely.\n\n";
  } else {
    summary += "✅ NORMAL BLOOD PRESSURE: Readings within healthy range (avg: " + 
               Math.round(avgSystolic) + "/" + Math.round(avgDiastolic) + " mmHg).\n\n";
  }

  // Heart rate analysis
  if (avgHeartRate > 90) {
    summary += "🔴 ELEVATED HEART RATE: Average " + Math.round(avgHeartRate) + 
               " bpm indicates tachycardia. Check for fever, pain, or anxiety.\n\n";
  } else if (avgHeartRate < 60) {
    summary += "🟡 LOW HEART RATE: Average " + Math.round(avgHeartRate) + 
               " bpm may indicate bradycardia. Review medications.\n\n";
  } else {
    summary += "✅ NORMAL HEART RATE: Average " + Math.round(avgHeartRate) + 
               " bpm within normal range.\n\n";
  }

  // Trend analysis
  if (vitals.length >= 3) {
    const trend = recent[0].systolic_bp - recent[2].systolic_bp;
    if (trend > 10) {
      summary += "📈 UPWARD TREND: Blood pressure increasing over recent readings. Increase monitoring frequency.";
    } else if (trend < -10) {
      summary += "📉 DOWNWARD TREND: Blood pressure decreasing. Monitor for hypotension symptoms.";
    } else {
      summary += "📊 STABLE TREND: Vital signs showing consistent pattern over recent readings.";
    }
  }

  return summary;
};