import Morphine from "https://deno.land/x/morphine@0.0.1/mod.ts";
import { post } from "./utils/fetch.ts";
import {
  getChatCompletion,
  sendTextMessage,
  startTyping,
  getFileLink,
  getLastChat,
  startNewConversation,
  ChatMessages,
  ChatMessage,
  updateConversation
} from './utils/chats.ts';
import { Update as TUpdate } from "./types/telegram.ts";
import { IGrammarResponse } from "./types/grammar.ts"

// constants
const GRAMMAR_API_URL = Deno.env.get('GRAMMAR_API') ?? '';
const ASR_API_URL = Deno.env.get('STT_API') ?? '';
const TOKEN = Deno.env.get('TELEGRAM_TOKEN') || '';
const TELEGRAM_API = 'https://api.telegram.org/bot'.concat(TOKEN);

interface IUpdateResult {
  ok: boolean;
  result: TUpdate[];
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

async function main() {
  console.log('📩 Polling messages...');
  for await (const updates of pollBotUpdates) {
    for (const { message } of updates) {
      if (!message) {
        continue;
      }
      // 1) Receive message
      const userId = message.from?.username || 'Unknown';
      const chatId = message.chat.id;
      const usrMessage: ChatMessage = {
        role: 'user',
        content: message.text ?? '',
        dateTime: new Date().toISOString()
      };
      let botResponse = '';
      const lastChat = await getLastChat(userId);

      // Start new conversation
      if (message.text === '/start' || !lastChat) {
        console.log('Starting new conversation...');
        await startNewConversation(chatId, userId);
        continue;
      }

      // show 'typing...' status in chat
      startTyping(chatId);

      // Process Voice Note
      if (message.voice) {
        console.log('🔉 Audio received. Transcribing...');
        const link = await getFileLink(message.voice);
        if (!link) {
          console.error('%c Download link not found', 'color: red');
          await sendTextMessage(
            chatId,
            `Sorry, I couldn't listent your voice note. Please, send it again.`
          );
          continue;
        }
        const { text, fileName } = await post(ASR_API_URL, { link });
        usrMessage.content = text;
        usrMessage.file = fileName;
      }
      console.log(`%c ${userId}:`, 'color: green', usrMessage.content);
      // 2) Check grammar
      const {
        label: grammarQuality,
        score: grammarScore
      } = await post(GRAMMAR_API_URL, { input: usrMessage.content }) as IGrammarResponse;

      // 3) Prepare Chat Response
      const chat = lastChat.chat as unknown as ChatMessages;
      chat.messages.push({ ...usrMessage, grammarScore });
      const messagesForCompletion = chat.messages.map(({ role, content }) => ({ role, content }));

      // If speech has really bad grammar ask student to try again
      if (message.voice && grammarQuality === 'BAD') {
        console.log(`%cGrammar: ${grammarQuality}. Score: ${grammarScore}`, 'color: orange; font-style: italic');
        botResponse = `Sorry, I think I don't understand. 🤔 Did you say "${usrMessage.content}"?`;
      } else {
        botResponse = await getChatCompletion(messagesForCompletion);
      }

      // 4) Send and save final message
      await sendTextMessage(chatId, botResponse);
      chat.messages.push({ role: 'assistant', content: botResponse });
      await updateConversation(lastChat.id, chat);
    }
  }
}

try {
  // Process messages
  await main();
} catch (err) {
  console.error(err);
}
