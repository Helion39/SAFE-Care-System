const axios = require('axios');

const sendMessageToChatbot = async (message) => {
  try {
    // Test dengan endpoint models dulu
    console.log('Testing models endpoint...');
    const modelsResponse = await axios.get(
      'https://mlapi.run/9331793d-efda-4839-8f97-ff66f7eaf605/v1/models',
      {
        headers: {
          'Authorization': `Bearer ${process.env.ELICE_API_KEY}`
        }
      }
    );
    console.log('Models available:', modelsResponse.data);
    
    // Gunakan model yang tersedia
    const availableModel = modelsResponse.data.data?.[0]?.id || 'gpt-3.5-turbo';
    console.log('Using model:', availableModel);
    
    const response = await axios.post(
      'https://mlapi.run/9331793d-efda-4839-8f97-ff66f7eaf605/v1/chat/completions',
      {
        model: availableModel,
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 150
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ELICE_API_KEY}`
        }
      }
    );

    const rawMessage = response.data.choices?.[0]?.message?.content || response.data.choices?.[0]?.text || 'Maaf, tidak ada respons.';
    
    // Clean response by removing <think> and <answer> tags
    let cleanMessage = rawMessage;
    
    // Remove <think>...</think> blocks completely
    cleanMessage = cleanMessage.replace(/<think>.*?<\/think>/gs, '');
    
    // Extract content from <answer>...</answer> tags if present
    const answerMatch = cleanMessage.match(/<answer>(.*?)<\/answer>/s);
    if (answerMatch) {
      cleanMessage = answerMatch[1];
    }
    
    // Remove any remaining XML-like tags
    cleanMessage = cleanMessage.replace(/<[^>]*>/g, '');
    
    // Clean up extra whitespace
    cleanMessage = cleanMessage.trim();
    
    return {
      success: true,
      data: {
        message: cleanMessage,
        timestamp: new Date()
      }
    };
  } catch (error) {
    console.error('[chatbotClient] Full Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: 'https://mlapi.run/9331793d-efda-4839-8f97-ff66f7eaf605/v1/completions',
      headers: error.config?.headers
    });
    throw new Error('Failed to get response from chatbot');
  }
};

module.exports = { sendMessageToChatbot };
