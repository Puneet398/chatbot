import React, { useState, useEffect, useRef } from 'react';
import pdfParse from 'pdf-parse';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hey There ● I'm your Intelligent AI Copilot for India's Biomaterials sector" },
    { role: 'assistant', content: "I'm analyzing the latest 2024 market data..." },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Initial loading state
  const [conversationStage, setConversationStage] = useState(0);
  const [pdfData, setPdfData] = useState(null);
  const messagesEndRef = useRef(null);

  // Simulate LLM thinking with random delays
  const simulateThinking = async (min = 800, max = 1500) => {
    const delay = Math.random() * (max - min) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  };

  // Load PDF data with loading states
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setMessages(prev => [...prev, 
          { role: 'assistant', content: "📄 Loading Sustainable PDF knowledge base..." }
        ]);
        
        const response = await fetch('/Sustainable_PDF.pdf');
        const arrayBuffer = await response.arrayBuffer();
        
        setMessages(prev => [...prev, 
          { role: 'assistant', content: "🔍 Extracting key market insights..." }
        ]);
        await simulateThinking();
        
        const { text } = await pdfParse(new Uint8Array(arrayBuffer));
        
        setMessages(prev => [...prev, 
          { role: 'assistant', content: "🧠 Processing sector-specific data..." }
        ]);
        await simulateThinking();
        
        // Extract structured data
        const sectors = {
          healthcare: extractSection(text, 'Healthcare and Biomedical Applications'),
          packaging: extractSection(text, 'Packaging and Consumer Products'),
          agriculture: extractSection(text, 'Agricultural Applications'),
          textiles: extractSection(text, 'Textiles and Fashion')
        };
        
        setPdfData({
          marketSize: extractMetric(text, 'biomaterials market'),
          sectors,
          partnerships: extractSection(text, 'Essential Local Partnerships'),
          policies: extractSection(text, 'Government Policy Framework')
        });
        
        setMessages(prev => [...prev, 
          { role: 'assistant', content: "✅ Knowledge base loaded successfully!" },
          { role: 'assistant', content: "India's biomaterials market is currently valued at $5.74B (projected $20.49B by 2032)" },
          { role: 'assistant', content: "Type 'Ready' to begin your market entry strategy!" }
        ]);
        
      } catch (error) {
        setMessages(prev => [...prev, 
          { role: 'assistant', content: "⚠️ Failed to load full knowledge base. Using basic mode." }
        ]);
      } finally {
        setIsLoading(false);
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
    if (!input.trim() || isLoading) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Simulate AI thinking
      await simulateThinking();
      
      let response;
      
      if (conversationStage === 0 && input.toLowerCase().includes('ready')) {
        response = { 
          content: "Which biomaterial sector are you targeting?\n\n" +
                   "1. Healthcare ($9.44B by 2030)\n" +
                   "2. Packaging (11.7% CAGR)\n" +
                   "3. Agriculture\n" + 
                   "4. Textiles"
        };
        setConversationStage(1);
      } 
      else if (conversationStage === 1) {
        // Simulate deeper analysis
        await simulateThinking(1200, 2000);
        
        const sector = getSectorFromInput(input);
        const sectorData = pdfData?.sectors[sector] || "";
        
        response = { 
          content: `Excellent choice! ${sectorData ? "Here's what I found:\n\n" + sectorData.substring(0, 500) + "..." : ""}\n\n` +
                   "What stage is your venture at?\n" +
                   "• Pre-seed\n" +
                   "• Series A\n" +
                   "• Growth Stage"
        };
        setConversationStage(2);
      }
      else if (conversationStage === 2) {
        // Simulate generating recommendations
        await simulateThinking(1500, 2500);
        
        response = { 
          content: generateRecommendations(input, pdfData)
        };
        setConversationStage(3);
      }
      else {
        // General Q&A mode with simulated thinking
        await simulateThinking(1000, 3000);
        
        const relevantContent = extractRelevantContent(input, pdfData);
        response = { 
          content: relevantContent || "Based on general market trends, I recommend..."
        };
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Let's refocus on your venture. What's your most pressing challenge?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const extractSection = (text, header) => {
    const start = text.indexOf(header);
    if (start === -1) return "";
    const end = text.indexOf('=====', start);
    return text.substring(start, end !== -1 ? end : text.length);
  };

  const extractMetric = (text, metric) => {
    const regex = new RegExp(`${metric}.*?(\\$[\\d\\.]+\\s?[mb]illion)`, 'i');
    const match = text.match(regex);
    return match ? match[1] : "";
  };

  const getSectorFromInput = (input) => {
    if (/health|medical/i.test(input)) return 'healthcare';
    if (/packag|consumer/i.test(input)) return 'packaging';
    if (/agricult|farm/i.test(input)) return 'agriculture';
    if (/textile|fashion/i.test(input)) return 'textiles';
    return 'healthcare'; // default
  };

  const generateRecommendations = (stage, data) => {
    // Simulate complex analysis
    const partnerships = data?.partnerships ? data.partnerships.substring(0, 800) : "";
    const policies = data?.policies ? data.policies.substring(0, 600) : "";
    
    return `For ${stage} ventures, here's your strategic roadmap:\n\n` +
           `1. ESSENTIAL PARTNERSHIPS:\n${partnerships || "Government and research institutions"}\n\n` +
           `2. POLICY SUPPORT:\n${policies || "BioE3 framework and PLI schemes"}\n\n` +
           `3. NEXT STEPS:\n- Connect with BIRAC\n- Validate technology with IITs/IISc\n- Engage regulatory consultants`;
  };

  const extractRelevantContent = (query, data) => {
    if (!data) return null;
    // Simple keyword search across all sections
    const keywords = query.toLowerCase().split(/\s+/);
    const allText = JSON.stringify(data).toLowerCase();
    
    return keywords.some(kw => allText.includes(kw))
      ? "From our analysis:\n\n" + 
        Object.entries(data).map(([key, value]) => 
          typeof value === 'string' && value.toLowerCase().includes(keywords[0])
            ? `${key}:\n${value.substring(0, 300)}...\n`
            : ""
        ).join('')
      : null;
  };

  return (
    <div className="app">
      <h1>AI VC</h1>
      <div className="chat-header">Today</div>
      
      <div className="chat-interface">
        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="message-content">
                {msg.role === 'user' ? msg.content : (
                  <>
                    {msg.content.split('\n').map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
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
            placeholder={isLoading ? "Waiting for response..." : "Type your message..."}
            autoFocus
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
