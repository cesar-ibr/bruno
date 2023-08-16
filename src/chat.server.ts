import { Bot, Context, GrammyError, HttpError } from "https://deno.land/x/grammy@v1.17.2/mod.ts";
import { supabaseClient } from "./utils/supabase.ts";
import { Database } from "./types/db.ts"
import { post } from "./utils/fetch.ts";
import {
  getChatGPTCompletion,
  getLastChat,
  insertNewConversation,
  ChatMessages,
  ChatMessage,
  updateConversation,
  updateTokenUsage,
  tokensAprox,
  CHAT_INSTRUCTIONS,
  ASK_START_CHAT,
  CHAT_LIMIT_MESSAGE,
  getFileLink
} from './utils/chat.ts';
import { IASRResponse, IGrammarResponse } from "./types/services.ts"

type TChatRecord = Database['public']['Tables']['conversations']['Row'];

// constants
const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_TOKEN') || '';
const GRAMMAR_API_URL = Deno.env.get('GRAMMAR_API') ?? '';
const ASR_API_URL = Deno.env.get('STT_API') ?? '';
const CHAT_TOKEN_LIMIT = 3500;

const tokenOverflow = (tokenUsage: number, text: string) => {
  const totalTokens = tokenUsage + tokensAprox(text);
  console.log('%cToken Usage:', 'color: blue', totalTokens);
  return totalTokens >= CHAT_TOKEN_LIMIT;
};

/**
 * Gets chat completion without modifying the Chat Record
 * @returns text completion
 */
const processChatCompletion = async (chatRecord: TChatRecord, chatMsg: ChatMessage) => {
  const chatHistory = (chatRecord.chat as unknown as ChatMessages).messages;
  const chatForCompletion = [...chatHistory, chatMsg].map(({ role, content }) => ({ role, content }));
  const { tokens, text } = await getChatGPTCompletion(chatForCompletion);
  await updateTokenUsage(chatRecord.id, tokens);
  return text;
};

const sendMessage = async (text: string, ctx: Context) => {
  console.log('%cBruno:', 'color: green', text);
  await ctx.reply(text);
}

const getTranscription = async (fileLink: string) => {
  console.log('%cTranscribing file...', 'color: pink');
  console.time('ASR_TIME');
  const {
    text = '',
    fileName = ''
  } = await post(ASR_API_URL, { link: fileLink }) as IASRResponse;
  console.timeEnd('ASR_TIME');
  return { text, fileName };
};

const getGrammarEval = async (input = '') => {
  console.log('%cEvaluating grammar...', 'color: pink');
  console.time('GRAMMAR_TIME');
  const results = await post(GRAMMAR_API_URL, { input }) as IGrammarResponse;
  console.timeEnd('GRAMMAR_TIME');
  return results;
};


// New Implementation
const bot = new Bot(TELEGRAM_TOKEN);

/* Commands */
bot.command('start', async (ctx) => {
  const { from, chat } = ctx;
  const user = from?.username || from?.first_name || from?.id || '';
  const userName = String(user).replaceAll(' ', '');
  const response = await insertNewConversation(chat.id, userName);
  console.log('%cBruno:', 'color: green', response);
  await sendMessage(response, ctx);
});

bot.command('suggestions', async (ctx) => {
  await ctx.reply(CHAT_INSTRUCTIONS, { parse_mode: 'HTML' });
});

bot.command('feedback', async (ctx) => {
  await sendMessage('Sorry, this feature is not available yet 😅', ctx);
});

/* Text Message */
bot.on('message:text', async (ctx) => {
  const { chat, message, from } = ctx;
  const userId = from?.username || from?.id || '🤷‍♂️';
  const recentChat = await getLastChat(chat.id);
  const usrMessage: ChatMessage = { role: 'user', content: message.text };
  console.log(`%c${userId}:`, 'color: yellow', message.text);

  if (!recentChat) {
    return await sendMessage(ASK_START_CHAT, ctx);
  }

  if (tokenOverflow(recentChat.token_usage, message.text)) {
    return await sendMessage(CHAT_LIMIT_MESSAGE, ctx);
  }

  await bot.api.sendChatAction(chat.id, 'typing');

  // process model completion
  const modelResponse = await processChatCompletion(recentChat, usrMessage);
  await sendMessage(modelResponse, ctx);

  // check grammar
  const { score } = await getGrammarEval(message.text);

  // update chat history
  const msgISODate = new Date(message.date * 1000).toISOString();
  const chatHistory = (recentChat.chat as unknown as ChatMessages).messages;
  chatHistory.push({ ...usrMessage, score, dateTime: msgISODate });
  chatHistory.push({ role: 'assistant', content: modelResponse });
  await updateConversation(recentChat.id, { messages: chatHistory });
});

bot.on('message:voice', async (ctx) => {
  const { chat, from, message } = ctx;
  const userId = from?.username || from?.id || '🤷‍♂️';
  const file = await ctx.getFile();
  const fileLink = getFileLink(file);
  const recentChat = await getLastChat(chat.id);
  // look for recent chat
  if (!recentChat) {
    return await sendMessage(ASK_START_CHAT, ctx);
  }
  // transcribe audio (update status)
  const { text, fileName } = await getTranscription(fileLink);
  const usrMessage: ChatMessage = { role: 'user', content: text };
  console.log(`%c${userId}:`, 'color: yellow', text);

  // check token limit
  if (tokenOverflow(recentChat.token_usage, text)) {
    return await sendMessage(CHAT_LIMIT_MESSAGE, ctx);
  }

  // process completion
  bot.api.sendChatAction(chat.id, 'typing'); // no need to await
  const modelResponse = await processChatCompletion(recentChat, usrMessage);
  await sendMessage(modelResponse, ctx);

  // check grammar score
  const { score } = await getGrammarEval(text);

  // update chat history
  const msgISODate = new Date(message.date * 1000).toISOString();
  const chatHistory = (recentChat.chat as unknown as ChatMessages).messages;
  chatHistory.push({ ...usrMessage, fileName, score, dateTime: msgISODate });
  chatHistory.push({ role: 'assistant', content: modelResponse });
  await updateConversation(recentChat.id, { messages: chatHistory });
});


/* Handle Error */
bot.catch(({ ctx, error }) => {
  const userId = ctx.from?.username || ctx.from?.id || '🤷‍♂️';
  const chatId = ctx.chat?.id;
  console.log(`%cError while processing message from ${userId} in chat ${chatId}`, 'color: red');
  const message = error instanceof GrammyError ? `Error in request ${error.description}` :
    error instanceof HttpError ? 'Could not contact Telegram' :
      `${error}`;
  console.error(message);
  // Notify about error
  supabaseClient
    .functions
    .invoke('notify', { body: { message, userId, chatId } })
    .catch(() => console.log('Error while sending notification 😥'));
  // Try to reply to user
  ctx.reply(`🤖💥 There's a technical issue with Bruno at the moment. He'll be back soon 🦾`);
});


bot.start({
  onStart: (botInfo) => {
    console.log('%c[CHAT] Bot connected!', 'color: green');
    console.log('[CHAT] Bot Info:', botInfo);
    console.log('[CHAT] Listening...');
  }
});
