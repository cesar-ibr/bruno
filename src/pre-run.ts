import { get, post } from "./utils/fetch.ts";
import { logTime } from "./utils/logger.ts";

const GRAMMAR_API_URL = Deno.env.get('GRAMMAR_API') ?? '';
const ASR_API_URL = Deno.env.get('STT_API') ?? '';
const TOKEN = Deno.env.get('TELEGRAM_TOKEN') || '';
const TELEGRAM_API = 'https://api.telegram.org/bot'.concat(TOKEN);

// Test Bot connection
let start = Date.now();
const { ok = false } = await get(`${TELEGRAM_API}/getMe`);
// throws error if response ok is not true
if (!ok) {
  console.error('Bot connection failed ❗️', 'color: red');
  throw new Error('Login Failed');
}
console.log('✅ Successful bot conenction');
logTime(start);

// Test ASR service
start = Date.now();
const { text } = await post(ASR_API_URL, { link: './example_audio/i-will-went.ogg' });
const assertedTxt = text.includes('to a soccer game of the school of the state');

if (!text || !assertedTxt) {
  console.error('ASR output is not what expected', 'color: red');
  throw new Error('ASR Service not working');
}
console.log('✅ ASR service working');
logTime(start);

// Test Grammar service
start = Date.now();
const { score } = await post(GRAMMAR_API_URL, { input: 'This text has a gramar error' });

if (typeof score !== 'number') {
  console.error('Grammar output is not what expected', 'color: red');
  throw new Error('Grammar Service not working');
}
console.log('✅ Grammar service working');
logTime(start);