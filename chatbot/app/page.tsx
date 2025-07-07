'use client';

import { useState, useRef, useEffect } from 'react';

export default function PDFChatbot() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract text from PDF
  const extractTextFromPDF = async (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
          // @ts-ignore - Using browser's PDF.js
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          let fullText = '';
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: { str: any; }) => item.str).join(' ');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setMessages([...messages, {role: 'system', content: 'PDF processed successfully! You can now ask questions.'}]);
    } catch (error) {
      console.error("Error processing PDF:", error);
      setMessages([...messages, {role: 'system', content: 'Error processing PDF. Please try again.'}]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Simple text search implementation
  const findRelevantText = (question: string) => {
    if (!pdfText) return '';
    
    // Split PDF text into paragraphs
    const paragraphs = pdfText.split('\n\n');
    
    // Simple keyword matching (for demo purposes)
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
    
    return bestMatch || "Not Found!!";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !pdfText) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');

    try {
      // Simple response generation based on text matching
      const relevantText = findRelevantText(input);
      
      let response = relevantText;
      
      // Truncate if too long
      // if (response.length > 1000) {
      //   response = response.substring(0, 100000) ;
      // }
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your question.' }]);
    }
  };

  // Load PDF.js library dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js';
    script.onload = () => {
      // @ts-ignore
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
    };
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-green-600 text-white p-4">
        <h1 className="text-2xl font-bold">Chatbot</h1>
        {/* <p>No API keys required - processes PDFs in your browser</p> */}
      </header>

      <div className="flex-grow p-4 overflow-auto">
        {/* PDF Upload Section */}
        {!pdfText && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Upload PDF</h2>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="flex-grow p-2 border rounded"
                disabled={isProcessing}
              />
              <button
                onClick={processPDF}
                disabled={!pdfFile || isProcessing}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-400"
              >
                {isProcessing ? 'Processing...' : 'Process PDF'}
              </button>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white ml-auto max-w-3/4'
                  : message.role === 'assistant'
                  ? 'bg-gray-200 mr-auto max-w-3/4'
                  : 'bg-yellow-100 mx-auto max-w-3/4'
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>
      </div>

      {/* Input Form */}
      {pdfText && (
        <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
          <div className="flex">
            <input
              className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-green-500"
              value={input}
              placeholder="Ask something about the PDF..."
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-r hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isProcessing}
            >
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  );
}