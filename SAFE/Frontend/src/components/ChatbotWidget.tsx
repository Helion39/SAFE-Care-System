import React, { useState, useRef, useEffect, FC, FormEvent, ChangeEvent } from 'react';
import { MessageSquare, Send, X, Bot, User, ChevronsUp } from 'lucide-react';
import apiService from '../services/api';

interface Message {
  sender: 'ai' | 'user';
  text: string;
}

interface ChatHistoryPart {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const ChatbotWidget: FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: 'Hello! How can I assist you with the SAFE Care System today?' }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && !isLoading) {
      inputRef.current?.focus();
    }
  }, [isOpen, isLoading]);
  const toggleChat = () => setIsOpen(prev => !prev);

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { sender: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const history: ChatHistoryPart[] = messages.map(msg => ({
        role: msg.sender === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));
      
      const response = await apiService.chatWithAI(inputValue, history);
      const aiMessage: Message = { sender:'ai', text: response.reply };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: Message = { sender: 'ai', text: "Sorry, I'm having trouble connecting. Please try again later." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <>
      {/* FAB (Floating Action Button) */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-blue-600 hover:scale-110"
        title="Open AI Assistant"
      >
        {isOpen ? <ChevronsUp size={28} /> : <MessageSquare size={28} />}
      </button>

      {/* Chat Windows */}
      {isOpen && (
        <div 
          className="fixed bottom-[3rem] right-6 z-50 flex h-[550px] w-96 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Bot size={20} />
              </div>
              <h3 className="text-md font-semibold text-gray-800">AI Assistant</h3>
            </div>
            <button onClick={toggleChat} className="rounded-full p-1 text-gray-500 hover:bg-gray-200">
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-gray-100/50 p-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  msg.sender === 'ai' 
                  ? 'bg-gray-200 text-gray-800 rounded-bl-lg' 
                  : 'bg-blue-200 text-white rounded-br-lg'
                }`}>
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-end gap-2">
                <div className="max-w-[80%] rounded-2xl bg-gray-200 px-4 py-2 rounded-bl-lg">
                  {/* Typing Indicator */}
                  <div className="flex items-center justify-center gap-1 p-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="border-t border-gray-200 bg-white p-3">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="w-full flex-1 rounded-full border border-gray-300 bg-gray-100 px-4 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={isLoading || !inputValue.trim()}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}