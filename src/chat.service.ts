import Morphine from "https://deno.land/x/morphine@0.0.1/mod.ts";
import { get, post } from "./utils/fetch.ts";
import { appendMessage, getCompletion, initChat, getChatHistory, saveChats } from './utils/chats.ts';
import { Update as TUpdate } from "./types/telegram.ts";
import { IGrammarResponse } from "./types/grammar.ts"
import { supabaseClient } from './utils/supabase.ts';

// constants
const GRAMMAR_API_URL = Deno.env.get('GRAMMAR_API') ?? '';
const ASR_API_URL = Deno.env.get('STT_API') ?? '';
const TOKEN = Deno.env.get('TELEGRAM_TOKEN') || '';
const TELEGRAM_API = 'https://api.telegram.org/bot'.concat(TOKEN);
const TELEGRAM_FILE_API = 'https://api.telegram.org/file/bot'.concat(TOKEN);

interface IUpdateResult {
  ok: boolean;
  result: TUpdate[];
}

// Get latest prompt
const {
  data = [],
  error
} = await supabaseClient
  .from('lessons')
  .select()
  .order('created_at', { ascending: false });

if (error) {
  console.log(`%c DB Error: ${error.message}`, 'color: red');
}

const basePrompt = data && data.length ? data[0].prompt : 'You are Bruno, an English teacher';
const starterMessage: string = data && data.length ? data[0].starter : 'What would you like to practice today?';
console.log(`%cBase Prompt: ${basePrompt}`, 'color: yellow; font-style: italic');

// Test Server Connection
try {
  const { ok = false } = await get(`${TELEGRAM_API}/getMe`);
  // throws error if response ok is not true
  if (!ok) {
    throw new Error('Login Failed');
  }
  console.log('🎉 Login Successful!');
} catch (err) {
  console.error('Login Failed ❗️', err);
}

const getFileLink = async (fileId = '') => {
  const url = `${TELEGRAM_API}/getFile?file_id=${fileId}`;
  const res = await get(url);

  if (res.ok && res.result?.file_path) {
    const filePath = res.result?.file_path;
    return `${TELEGRAM_FILE_API}/${filePath}` as string;
  }
}

// Iterator for async polling
const pollBotUpdates = new Morphine<TUpdate[]>((async function* () {
  let offset = 0;
  const url = `${TELEGRAM_API}/getUpdates`;
  while (true) {
    // poll every 10 seconds
    const data = await post(url, { offset, timeout: 10 }) as IUpdateResult;
    const updates = data.result;
    if (updates.length) {
      offset = updates[updates.length - 1].update_id + 1;
      yield data.result;
    }
  }
})());

Deno.addSignalListener('SIGINT', () => {
  console.log('\n--- Saving chats.json before exit...');
  saveChats();
  Deno.exit();
});

async function main() {
  console.log('=== Polling new messages...');
  for await (const updates of pollBotUpdates) {
    for (const { message } of updates) {
      if (!message) {
        continue;
      }
      // 1) Receive message
      const userId = message.from?.username || 'Unknown';
      const chat_id = message.chat.id;
      let userText = message.text ?? '';

      // Handle /start
      if (userText === '/start') {
        initChat({ userId, basePrompt, starterMessage });
        await post(`${TELEGRAM_API}/sendMessage`, {
          chat_id,
          text: starterMessage.replace('{{NAME}}', userId),
        });
        continue;
      }

      // send 'typing...' every 7 seconds
      const intvl = setInterval(() => post(`${TELEGRAM_API}/sendChatAction`, { chat_id, action: 'typing' }), 7000);

      // Process Voice Note
      if (message.voice) {
        console.log('🔉 transcribing audio...');
        const { file_id } = message.voice;
        const link = await getFileLink(file_id);
        if (!link) {
          clearInterval(intvl);
          console.error('%cDownload link not found', 'color: red');
          await post(
            `${TELEGRAM_API}/sendMessage`,
            {
              chat_id, text: 'Sorry, I cannot listent your audio right now'
            });
          continue;
        }
        const { text } = await post(ASR_API_URL, { link });
        userText = text;
      }
      console.log(`%c${userId}:`, 'color: green', userText);
      // 2) Check grammar
      const { label: grammarQuality, score } = await post(GRAMMAR_API_URL, { input: userText }) as IGrammarResponse;

      // 3) Get Chat Completion
      if (!getChatHistory(userId)) {
        initChat({ userId, basePrompt, starterMessage });
      }
      appendMessage(userId, { role: 'user', content: userText });
      // 4) If the message is not understandable ask user to try again
      if (grammarQuality === 'BAD') {
        console.log(`%cGrammar: ${grammarQuality}. Score: ${score}`, 'color: orange; font-style: italic');
        const reply = `Sorry, I think I don't understand you. Did you say "${userText}"?`;
        appendMessage(userId, { role: 'assistant', content: reply });
        await post(`${TELEGRAM_API}/sendMessage`, { text: reply, chat_id });
        continue;
      }
      const botResponse = await getCompletion(userId);
      appendMessage(userId, { role: 'assistant', content: botResponse });

      console.log(`%cBruno:`, 'color: #31AFDE', botResponse);
      clearInterval(intvl);

      // 5) Send final message
      const payload = { text: botResponse, chat_id };
      await post(`${TELEGRAM_API}/sendMessage`, payload);
    }
  }
}

try {
  await main();
} catch (err) {
  console.error(err);
}
