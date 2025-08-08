const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

exports.handleChat = async (req, res) => {
  try {
    const { message, history: clientHistory = [] } = req.body;

    console.log("🤖 Received chat request:", { message });

    // Ensure a message was provided in the request
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // --- Prompt Engineering: Define the AI's role and constraints ---

    // A detailed system instruction that sets the persona, rules, and limitations for the AI.
    const systemInstructionText = `
      You are an AI Health Assistant for the SAFE Care system.
      Your primary and sole role is to answer questions related to health, fitness, medical information, medications, and disease symptoms.
      You are STRICTLY FORBIDDEN from answering questions outside of the health topic.
      If a user asks about another topic (for example: programming, history, news, or personal conversations), you must politely decline to answer and remind the user that you can only assist with health-related questions.
      IMPORTANT: In all of your responses, never use bold formatting (markdown bold, for example **text**). Present all text as plain text.
      Make sure your answer is not more than 100 words.
    `;

    // We use a "priming" technique by creating a fake user/model exchange at the start of the history.
    // This effectively forces the model to acknowledge and commit to its role.
    const systemPrompt = [
      {
        role: 'user',
        parts: [{ text: systemInstructionText }],
      },
      {
        role: 'model',
        parts: [{ text: 'Okay, I understand completely. I am an AI Health Assistant for SAFE Care. I will only answer health-related questions in plain text, without bold formatting, and I will keep my answers under 50 words.' }],
      }
    ];

    // Prepend the system prompt to the chat history sent from the client.
    const fullHistory = [...systemPrompt, ...clientHistory];

    console.log("📜 Final history being sent to Gemini:", JSON.stringify(fullHistory, null, 2));
    
    // Start a new chat session with the full history, including our instructions
    const chat = model.startChat({
      history: fullHistory,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    console.log("✅ Gemini API response successful.");
    res.json({ reply: text });

  } catch (error) {
    console.error('❌ Error communicating with Gemini API:', error);
    // Provide more detailed error info to the client during development
    res.status(500).json({ 
        error: 'Failed to get response from AI',
        details: error.message
    });
  }
};