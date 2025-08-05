import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User } from 'lucide-react';
import apiService from '../services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotProps {
  currentUser: any;
}

export function Chatbot({ currentUser }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your healthcare assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBotResponse = async (userMessage: string): Promise<string> => {
    try {
      const response = await apiService.sendChatMessage(userMessage);
      if (response.success && response.data.message) {
        return response.data.message;
      }
      throw new Error('API response failed');
    } catch (error) {
      console.error('Chatbot API error:', error);
      // Fallback to local responses
      const message = userMessage.toLowerCase();
      
      if (message.includes('blood pressure') || message.includes('bp')) {
        return 'Normal blood pressure is typically below 120/80 mmHg. High BP (>140/90) requires monitoring. Always consult with the attending physician for concerning readings.';
      }
      
      if (message.includes('heart rate') || message.includes('pulse')) {
        return 'Normal resting heart rate for adults is 60-100 bpm. Contact medical staff if rate is consistently outside normal range.';
      }
      
      return 'I can help with questions about vital signs, medications, emergency procedures, and fall prevention. What specific topic would you like to know about?';
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Get AI response
    setTimeout(async () => {
      try {
        const responseText = await generateBotResponse(inputText);
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: 'bot',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botResponse]);
      } catch (error) {
        console.error('Error getting bot response:', error);
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: 'I apologize, but I\'m having trouble connecting right now. Please consult your supervisor for assistance.',
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorResponse]);
      } finally {
        setIsTyping(false);
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 btn btn-primary rounded-full w-14 h-14 shadow-lg"
        style={{ minHeight: '56px' }}
      >
        <MessageCircle style={{ width: '1.5rem', height: '1.5rem' }} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 h-96 bg-white border-2 border-primary rounded-lg shadow-lg flex flex-col" style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b-2 border-primary-hover bg-primary text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bot style={{ width: '1.25rem', height: '1.25rem' }} />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: '600' }}>Healthcare Assistant</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-primary-hover rounded p-1"
        >
          <X style={{ width: '1rem', height: '1rem' }} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ backgroundColor: '#FFFFFF' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-primary text-white'
                  : 'text-gray-800'
              }"
              style={{
                backgroundColor: message.sender === 'user' ? 'var(--primary)' : '#F5F5F5'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.sender === 'bot' && (
                  <Bot style={{ width: '1rem', height: '1rem', marginTop: '2px', flexShrink: 0 }} />
                )}
                {message.sender === 'user' && (
                  <User style={{ width: '1rem', height: '1rem', marginTop: '2px', flexShrink: 0 }} />
                )}
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', lineHeight: '1.4' }}>
                    {message.text}
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      opacity: 0.7,
                      marginTop: '0.25rem'
                    }}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="text-gray-800 px-3 py-2 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
              <div className="flex items-center gap-2">
                <Bot style={{ width: '1rem', height: '1rem' }} />
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t-2 border-gray-300" style={{ backgroundColor: 'var(--gray-50)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about healthcare procedures..."
            className="flex-1 input"
            style={{ fontSize: 'var(--text-sm)' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="btn btn-primary btn-sm"
            style={{ minWidth: 'auto', padding: '0.5rem' }}
          >
            <Send style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>
      </div>
    </div>
  );
}