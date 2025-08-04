const axios = require('axios');
const logger = require('../utils/logger');

// Elice API configuration
const ELICE_API_URL = process.env.ELICE_API_URL;
const ELICE_API_KEY = process.env.ELICE_API_KEY;

// Healthcare context prompt
const HEALTHCARE_CONTEXT = `You are a healthcare assistant for caregivers in an elderly care facility. 
Provide concise, professional medical guidance. Focus on:
- Vital signs interpretation
- Emergency protocols
- Medication safety
- Fall prevention
- Pain assessment
- General healthcare procedures

Keep responses under 150 words and always recommend consulting physicians for serious concerns.`;

// @desc    Get chatbot response
// @route   POST /api/chatbot/message
// @access  Private/Caregiver
const getChatbotResponse = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Call Elice API with simple format
    const response = await axios.post(ELICE_API_URL, {
      prompt: `${HEALTHCARE_CONTEXT}\n\nPertanyaan: ${message}\nJawaban:`,
      max_tokens: 150,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${ELICE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const botResponse = response.data.choices?.[0]?.text || response.data.text || response.data.completion || 'Maaf, saya tidak dapat memberikan respons saat ini.';

    logger.info(`Chatbot response generated for user ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: {
        message: botResponse,
        timestamp: new Date()
      }
    });

  } catch (error) {
    logger.error('Chatbot response error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: ELICE_API_URL
    });
    
    // Fallback response if API fails
    const fallbackResponse = 'Maaf, saya sedang mengalami gangguan koneksi. Silakan konsultasi dengan supervisor atau staf medis untuk bantuan segera.';
    
    res.status(200).json({
      success: true,
      data: {
        message: fallbackResponse,
        timestamp: new Date()
      }
    });
  }
};

module.exports = {
  getChatbotResponse
};