// api/chat.js
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { HuggingFaceInference } from '@huggingface/inference';

// Initialize HuggingFace
const hf = new HuggingFaceInference({
  apiKey: process.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
});

// Load and process PDF
let pdfText = '';
const loader = new PDFLoader('sustainable_PDF.pdf');
const docs = await loader.load();
pdfText = docs.map(doc => doc.pageContent).join('\n');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question } = req.body;
    
    // Create context from PDF content that's most relevant to the question
    const context = extractRelevantContext(question, pdfText);
    
    const response = await hf.textGeneration({
      model: 'meta-llama/Llama-2-7b-chat-hf',
      inputs: `Context from PDF: ${context}\n\nQuestion: ${question}\nAnswer:`,
      parameters: { 
        max_new_tokens: 150,
        temperature: 0.7,
        return_full_text: false
      }
    });

    res.status(200).json({ answer: response.generated_text.trim() });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to extract relevant parts of the PDF
function extractRelevantContext(question, fullText) {
  // Simple implementation - in production you'd want something more sophisticated
  const sentences = fullText.split('.');
  const questionKeywords = question.toLowerCase().split(' ');
  
  // Find sentences that contain any of the question keywords
  const relevantSentences = sentences.filter(sentence => 
    questionKeywords.some(keyword => 
      sentence.toLowerCase().includes(keyword)
    )
  ).slice(0, 5); // Limit to 5 most relevant sentences
  
  return relevantSentences.join('. ');
}
