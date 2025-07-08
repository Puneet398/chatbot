import { useState, useEffect, useRef } from 'react';
import './App.css'; // Optional: minimal styling

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const res = await fetch('main', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error contacting server.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="chatbot-container" style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'Arial' }}>
      <h2>PDF Chatbot</h2>

      <div style={{ border: '1px solid #ccc', padding: 10, height: 400, overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ margin: '10px 0', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
            <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
          </div>
        ))}
        {isProcessing && (
          <div style={{ textAlign: 'left' }}>Bot: <em>Typing...</em></div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', marginTop: 10 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isProcessing}
          placeholder="Ask a question from the PDF..."
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" disabled={isProcessing} style={{ padding: '0 12px' }}>Send</button>
      </form>
    </div>
  );
}

export default App;
