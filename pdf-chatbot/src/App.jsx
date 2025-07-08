import { useState, useEffect, useRef } from 'react';
import './PDFChatbot.css'; // We'll create this CSS file

function PDFChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfText, setPdfText] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Extract text from PDF
  const extractTextFromPDF = async (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target.result);
          const pdf = await window.pdfjsLib.getDocument(typedArray).promise;
          let fullText = '';
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
          }
          
          resolve(fullText);
        } catch (error) {
          reject(error);
        }
      };
      
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const processPDF = async () => {
    if (!pdfFile) return;
    
    setIsProcessing(true);
    try {
      const text = await extractTextFromPDF(pdfFile);
      setPdfText(text);
      setMessages([...messages, 
        {role: 'system', content: 'PDF processed successfully! You can now ask questions.'}
      ]);
    } catch (error) {
      console.error("Error processing PDF:", error);
      setMessages([...messages, 
        {role: 'system', content: 'Error processing PDF. Please try again.'}
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Improved text search with highlighting
  const findRelevantText = (question) => {
    if (!pdfText) return '';
    
    const paragraphs = pdfText.split('\n\n');
    const keywords = question.toLowerCase().split(' ');
    let bestMatch = '';
    let bestScore = 0;
    
    for (const paragraph of paragraphs) {
      let score = 0;
      for (const keyword of keywords) {
        if (paragraph.toLowerCase().includes(keyword)) {
          score += 1;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = paragraph;
      }
    }
    
    if (!bestMatch) return "I couldn't find relevant information about that in the document.";
    
    // Highlight keywords in the response
    let highlighted = bestMatch;
    keywords.forEach(keyword => {
      if (keyword.length > 3) { // Only highlight words longer than 3 chars
        const regex = new RegExp(`(${keyword})`, 'gi');
        highlighted = highlighted.replace(regex, '<mark>$1</mark>');
      }
    });
    
    return highlighted;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !pdfText) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const response = findRelevantText(input);
      setMessages(prev => [...prev, 
        { role: 'assistant', content: response }
      ]);
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages(prev => [...prev, 
        { role: 'assistant', content: 'Sorry, I encountered an error processing your question.' }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Load PDF.js library dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
    };
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="chatbot-container">
      <header className="chatbot-header">
        <h1>Chatbot</h1>
      </header>

      <div className="chatbot-main">
        {!pdfText ? (
          <div className="upload-section">
            <div className="upload-card">
              <h2>Upload Research PDF</h2>
              <div className="upload-controls">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="file-input"
                  id="pdf-upload"
                  disabled={isProcessing}
                />
                <label htmlFor="pdf-upload" className="file-label">
                  {pdfFile ? pdfFile.name : "Choose a file"}
                </label>
                <button
                  onClick={processPDF}
                  disabled={!pdfFile || isProcessing}
                  className="process-button"
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner"></span>
                      Processing...
                    </>
                  ) : (
                    'Analyze PDF'
                  )}
                </button>
              </div>
              <p className="file-hint">Supported formats: PDF (max 20MB)</p>
            </div>
          </div>
        ) : (
          <>
          

            <div className="chat-messages">
              {messages.map((message, index) => (
            message.role === 'assistant' ? (
              <div
                key={index}
                className={`message ${message.role}`}
                dangerouslySetInnerHTML={{ __html: message.content }}
              />
            ) : (
              <div
                key={index}
                className={`message ${message.role}`}
              >
                {message.content}
              </div>
            )
          ))}
              {isProcessing && (
                <div className="message assistant">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="chat-input-form">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask any questions...."
                disabled={isProcessing}
              />
              <button type="submit" disabled={isProcessing}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default PDFChatbot;