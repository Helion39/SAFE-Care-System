const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Google Generative AI client
let genAI, model;

try {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  console.log("✅ Google Generative AI initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize Google Generative AI:", error);
}

const generateHealthAnalysis = async (req, res) => {
  try {
    const { vitals, residentName, residentAge, medicalConditions } = req.body;

    console.log("🏥 Received health analysis request for:", residentName);

    // Validate required data
    if (!vitals || !Array.isArray(vitals) || vitals.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Vitals data is required and must be a non-empty array' 
      });
    }

    if (!residentName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Resident name is required' 
      });
    }

    // Prepare vitals data for analysis
    const vitalsData = vitals.slice(0, 10).map(vital => ({
      timestamp: vital.timestamp || vital.recorded_at,
      systolic_bp: vital.systolic_bp || vital.systolicBP,
      diastolic_bp: vital.diastolic_bp || vital.diastolicBP,
      heart_rate: vital.heart_rate || vital.heartRate,
      temperature: vital.temperature,
      oxygen_saturation: vital.oxygen_saturation || vital.oxygenSaturation
    }));

    // Create comprehensive health analysis prompt
    const analysisPrompt = `
You are a healthcare AI assistant analyzing vital signs for an elderly care facility. 

PATIENT INFORMATION:
- Name: ${residentName}
- Age: ${residentAge || 'Not specified'}
- Medical Conditions: ${medicalConditions && medicalConditions.length > 0 ? medicalConditions.join(', ') : 'None specified'}

RECENT VITAL SIGNS DATA:
${vitalsData.map((vital, index) => `
${index + 1}. ${vital.timestamp ? new Date(vital.timestamp).toLocaleString() : 'Time not specified'}
   - Blood Pressure: ${vital.systolic_bp || 'N/A'}/${vital.diastolic_bp || 'N/A'} mmHg
   - Heart Rate: ${vital.heart_rate || 'N/A'} bpm
   - Temperature: ${vital.temperature || 'N/A'}°C
   - Oxygen Saturation: ${vital.oxygen_saturation || 'N/A'}%`).join('')}

Provide a brief health analysis (under 100 words) with:

1. VITAL SIGNS STATUS: Quick assessment of current readings
2. KEY CONCERNS: Any immediate issues requiring attention  
3. CARE ACTIONS: Specific next steps for the caregiver
4. PRIORITY LEVEL: LOW, MODERATE, or HIGH

FORMATTING RULES:
- Use plain text only (no bold, italic, or markdown)
- Use simple bullet points with •
- Be concise and actionable
- Focus on what the caregiver should do next

This is for caregiver guidance only, not medical diagnosis.
`;

    console.log("📋 Sending health analysis prompt to Gemini API");

    if (!model) {
      throw new Error("Gemini AI model not initialized");
    }

    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const analysisText = response.text();

    console.log("✅ Health analysis generated successfully");

    res.json({ 
      success: true,
      data: {
        analysis: analysisText,
        residentName,
        analyzedVitals: vitalsData.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generating health analysis:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate health analysis',
      details: error.message
    });
  }
};

module.exports = {
  generateHealthAnalysis
};