require('dotenv').config();
console.log('Current Directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('GEMINI_API_KEY Present:', !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY) {
    console.log('GEMINI_API_KEY Length:', process.env.GEMINI_API_KEY.length);
    console.log('GEMINI_API_KEY Start:', process.env.GEMINI_API_KEY.substring(0, 5));
}
console.log('GROK_API_KEY Present:', !!process.env.GROK_API_KEY);
