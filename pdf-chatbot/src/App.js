// App.js
import React, { useState, useEffect, useRef } from 'react';
import pdfParse from 'pdf-parse';
import { HfInference } from '@huggingface/inference';
import './App.css';

// Initialize Hugging Face inference
const hf = new HfInference(process.env.REACT_APP_HF_API_KEY);

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Loading sustainable practices knowledge base...' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pdfText, setPdfText] = useState('');
  const messagesEndRef = useRef(null);

  // Load PDF on component mount
  useEffect(() => {
    const loadPDF = async () => {
      try {
        // Replace with your actual PDF path
        const response = await fetch('/sustainable_pdf.pdf');
        const arrayBuffer = await response.arrayBuffer();
        const { text } = await pdfParse(new Uint8Array(arrayBuffer));
        setPdfText(text);
        setMessages([{ role: 'assistant', content: 'I\'ve loaded the sustainable practices knowledge base. Ask me anything!' }]);
      } catch (error) {
        console.error('PDF loading error:', error);
        setMessages([{ role: 'assistant', content: 'Failed to load knowledge base. Please refresh the page.' }]);
      }
    };

    loadPDF();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !pdfText) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsLoading(true);

    try {
      // Extract relevant context from PDF
      const relevantContext = extractRelevantContext(input, pdfText);
      
      // Get answer from LLM
      const response = await hf.textGeneration({
        model: 'meta-llama/Llama-2-7b-chat-hf',
        inputs: `You are a sustainability expert. Use this context to answer:
        
        Context: ${relevantContext}
        
        Question: ${input}
        
        Answer:`,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          do_sample: true,
        }
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.generated_text.trim() || "I couldn't find an answer in the document."
      }]);
    } catch (error) {
      console.error('API Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: error.message || "Sorry, I encountered a technical issue."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple context extraction
  const extractRelevantContext = (question, fullText) => {
    const keywords = question.toLowerCase().split(/\s+/);
    const sentences = fullText.split(/[.!?]+/);
    
    return sentences
      .filter(sentence => 
        keywords.some(keyword => 
          sentence.toLowerCase().includes(keyword)
      )
      .slice(0, 5)
      .join('. ');
  };

  return (
    <div className="app">
      <h1>Sustainability Knowledge Bot</h1>
      
      <div className="chat-interface">
        <div className="messages">
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
                <strong>Bot:</strong> Searching the knowledge base...
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
            disabled={isLoading || !pdfText}
            placeholder={pdfText ? "Ask about sustainable practices..." : "Loading knowledge base..."}
            autoFocus
          />
          <button 
            type="submit" 
            disabled={isLoading || !pdfText}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
