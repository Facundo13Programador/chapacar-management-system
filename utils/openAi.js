import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️ Falta OPENAI_API_KEY en .env');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
