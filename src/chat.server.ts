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
import { IASRResponse, IFeedbackRequest, IGrammarResponse } from "./types/services.ts"

type TChatRecord = Database['public']['Tables']['conversations']['Row'];

// constants
const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_TOKEN') || '';
const GRAMMAR_API_URL = Deno.env.get('GRAMMAR_API') ?? '';
const ASR_API_URL = Deno.env.get('STT_API') ?? '';
const FEEDBACK_API_URL = Deno.env.get('FEEDBACK_API') ?? '';
const NO_FEEDBACK_YET = `Congrats {{NAME}}! Up until now all your messages look good 👏🥳`;
const CHAT_TOKEN_LIMIT = 3500;
const GRAMMAR_LOW_SCORE = 80;

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

// Transform User's Telegram Message to Chat Messages for DB
const toChatMessage = (message: NonNullable<Context['message']>): ChatMessage => {
  const msgISODate = new Date(message.date * 1000).toISOString();
  return {
    role: 'user',
    content: message.text ?? '',
    dateTime: msgISODate,
    messageId: message.message_id,
  };
}

const bot = new Bot(TELEGRAM_TOKEN);

/** Commands */
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

bot.command('instructions', async (ctx) => {
  await ctx.reply(CHAT_INSTRUCTIONS, { parse_mode: 'HTML' });
});

bot.command('feedback', async (ctx) => {
  const { chat, from } = ctx;
  const user = from?.username || from?.first_name || from?.id || '';
  const userName = String(user).replaceAll(' ', '');
  // get last chat id
  const recentChat = await getLastChat(chat.id);
  if (!recentChat) {
    return await sendMessage(ASK_START_CHAT, ctx);
  }
  bot.api.sendChatAction(chat.id, 'typing');
  // get messages with low score
  const { data, error } = await supabaseClient.rpc('get_underscore_messages', {
    conversation_id: recentChat.id,
    score: GRAMMAR_LOW_SCORE
  });
  if (error) {
    throw error;
  }
  const messages = (data as unknown as ChatMessage[])
    .map(({ messageId, content }) => ({ messageId, text: content ?? '' }));
  // if no messages w/low score found return congrats
  if (!messages.length) {
    return sendMessage(NO_FEEDBACK_YET.replace('{{NAME}}', userName), ctx);
  }
  // send messages to Feedback service
  const payload: IFeedbackRequest = { chatId: chat.id, messages };
  post(FEEDBACK_API_URL, payload);
});

/* TEXT MESSAGES */
bot.on('message:text', async (ctx) => {
  const { chat, message, from } = ctx;
  const userId = from?.username || from?.id || '🤷‍♂️';
  const recentChat = await getLastChat(chat.id);
  const usrChatMessage = toChatMessage(message);
  console.log(`%c${userId}:`, 'color: yellow', message.text);

  if (!recentChat) {
    return await sendMessage(ASK_START_CHAT, ctx);
  }

  if (tokenOverflow(recentChat.token_usage, message.text)) {
    return await sendMessage(CHAT_LIMIT_MESSAGE, ctx);
  }

  await bot.api.sendChatAction(chat.id, 'typing');

  // process model completion
  const modelResponse = await processChatCompletion(recentChat, usrChatMessage);
  await sendMessage(modelResponse, ctx);

  // check grammar
  const { score } = await getGrammarEval(message.text);

  // update chat history
  const msgISODate = new Date(message.date * 1000).toISOString();
  const chatHistory = (recentChat.chat as unknown as ChatMessages).messages;
  chatHistory.push({ ...usrChatMessage, score, dateTime: msgISODate });
  chatHistory.push({ role: 'assistant', content: modelResponse });
  await updateConversation(recentChat.id, { messages: chatHistory });
});

/* VOICE NOTES */
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
  const usrChatMessage = toChatMessage({ ...message, text });
  console.log(`%c${userId}:`, 'color: yellow', text);

  // check token limit
  if (tokenOverflow(recentChat.token_usage, text)) {
    return await sendMessage(CHAT_LIMIT_MESSAGE, ctx);
  }

  // process completion
  bot.api.sendChatAction(chat.id, 'typing'); // no need to await
  const modelResponse = await processChatCompletion(recentChat, usrChatMessage);
  await sendMessage(modelResponse, ctx);

  // check grammar score
  const { score } = await getGrammarEval(text);

  // update chat history
  const chatHistory = (recentChat.chat as unknown as ChatMessages).messages;
  chatHistory.push({ ...usrChatMessage, fileName, score });
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
