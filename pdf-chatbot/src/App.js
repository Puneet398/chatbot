import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! Ask me anything about the PDF content.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsLoading(true);

    try {
      // Call Vercel serverless function
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input })
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <h1>PDF Knowledge Bot</h1>
      
      <div className="chat-window">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-content">
              <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <strong>Bot:</strong> <span className="typing">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="Ask about the PDF..."
          autoFocus
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default App;