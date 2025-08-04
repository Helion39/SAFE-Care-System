const express = require('express');
const router = express.Router();
const { sendMessageToChatbot } = require('../utils/chatbotClient');

router.post('/', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await sendMessageToChatbot(message);
    res.status(200).json(response);
  } catch (err) {
    console.error('Route error:', err);
    res.status(500).json({ error: 'Failed to get response from chatbot' });
  }
});

module.exports = router;
