import { HuggingFaceInference } from '@huggingface/inference';

const hf = new HuggingFaceInference({
  apiKey: process.env.HF_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question } = req.body;
    
    // Process question with LLaMA 2
    const response = await hf.textGeneration({
      model: 'meta-llama/Llama-2-7b-chat-hf',
      inputs: `PDF Content: ${pdfText}\n\nQuestion: ${question}\nAnswer:`,
      parameters: { max_new_tokens: 150 }
    });

    res.status(200).json({ answer: response.generated_text });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}