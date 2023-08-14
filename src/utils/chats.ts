import {
  ChatCompletionRequestMessage,
  Configuration,
  OpenAIApi,
} from 'https://esm.sh/openai@3.3.0';
import { get, post } from './fetch.ts';
import { Voice } from "../types/telegram.ts"
import { supabaseClient } from "./supabase.ts";

const TOKEN = Deno.env.get('TELEGRAM_TOKEN') || '';
const TELEGRAM_API = 'https://api.telegram.org/bot'.concat(TOKEN);
const TELEGRAM_FILE_API = 'https://api.telegram.org/file/bot'.concat(TOKEN);
const CHAT_INSTRUCTIONS = `
  👋 I'm Bruno and I'm here to help you practice you English. We can talk about any topic! Some *tips* 👇
  
  🎙 Send me voice notes to practice your speaking.
  
  💭 Ask me how to say something in English. *Example:* "How can I say _recordar_ in English?".
  
  🤔 Ask me if you don't understand something i said. *Example:* "What does _superlative_ mean?"
  
  🔁 Select */start* from the menu to start a new conversation.
`;

const openAIConfig = new Configuration({
  apiKey: Deno.env.get('OPENAI_KEY') ?? '',
});

const openai = new OpenAIApi(openAIConfig);

interface IChats {
  [key: string]: {
    messages: ChatCompletionRequestMessage[]
  }
}

export interface ChatMessage extends ChatCompletionRequestMessage {
  file?: string;
  dateTime?: string;
  grammarScore?: number;
}

export interface ChatMessages {
  messages: Array<ChatMessage>;
  [key: string]: any;
}

// Loading saved chats
const _chats: IChats = JSON.parse(localStorage.getItem('CHATS') || '{}');

let _intvl = 0;

export const getChatHistory = (userId = '') => {
  return _chats[userId];
};

const toMarkdown = (txt = '') => txt
  .replaceAll('\t', '')
  .replaceAll('!', '\\!')
  .replaceAll('.', '\\.')
  .trim()

export const startTyping = (chatId: number) => {
  const url = `${TELEGRAM_API}/sendChatAction`;
  _intvl = setInterval(() => post(url, { chat_id: chatId, action: 'typing' }), 7000);
};

const stopTyping = () => {
  if (_intvl) {
    clearInterval(_intvl);
  }
  _intvl = 0;
};

export const appendMessage = (userId: string, message: ChatCompletionRequestMessage) => {
  _chats[userId].messages.push(message);
};

export const capitalizeI = (text = '') => {
  return text.replace(/^i\s|\si\s/gm, ' I ').replaceAll(`i'm`, `I'm`).trim();
};

export const tokensAprox = (text = '') => {
  return text.split(' ').length * 1.5;
}

export const getChatCompletion = async (messages: ChatCompletionRequestMessage[]): Promise<{
  text: string;
  tokens?: number; // token usage
}> => {
  const res = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    temperature: 0.5,
    max_tokens: 256,
    messages,
  });
  const tokens = res.data.usage?.total_tokens;
  const text = res.data.choices[0].message?.content ?? '';
  return { tokens, text };
}

// Save chats in disk
export const saveChats = () => {
  const chatsStr = JSON.stringify(_chats);
  localStorage.setItem('CHATS', chatsStr);
  // Write file
  Deno.writeFileSync('./chats.json', new TextEncoder().encode(chatsStr));
};

/**
 * Telegram API
 */

export const getFileLink = async (voiceNote: Voice) => {
  const url = `${TELEGRAM_API}/getFile?file_id=${voiceNote.file_id}`;
  const res = await get(url);

  if (res.ok && res.result?.file_path) {
    const filePath = res.result?.file_path;
    return `${TELEGRAM_FILE_API}/${filePath}` as string;
  }
}

export const sendTextMessage = async (chatId: number, text: string, markdown = false) => {
  stopTyping();
  console.log(`%c Bruno:`, 'color: #31AFDE', text);
  const res = await post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text:  markdown ? toMarkdown(text) : text,
    parse_mode: markdown ? 'MarkdownV2' : '',
  });
  if (!res.ok) {
    console.log(`%c Error sending text message to chat ${chatId}`, 'color: red');
  }
}

/**
 * Supabase Transactions
 */

export const getChatStarter = async () => {
  const {
    data = [],
    error
  } = await supabaseClient
    .from('lessons')
    .select()
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  const systemPrompt = data?.[0].prompt ?? 'You are Bruno, an English teacher';
  const message = data?.[0].starter ?? 'What would you like to practice today?';
  return { systemPrompt, message };
}

type TInitChatParams = {
  userId: string;
  systemPrompt: string;
  starterMessage: string;
  chatId?: number;
};

export const initChat = async ({
  userId,
  systemPrompt,
  starterMessage,
  chatId
}: TInitChatParams) => {
  const prompt = systemPrompt.replace('{{NAME}}', userId).trim();
  const starter = starterMessage.replace('{{NAME}}', userId).trim();
  const messages = [
    { role: 'system', content: prompt },
    { role: 'assistant', content: starter },
  ];
  const date = new Date().toISOString();
  const { error, data } = await supabaseClient
    .from('conversations')
    .insert({
      userId: userId || `Unknown_${chatId}`,
      chat: { messages },
      date,
      topics: '',
      chat_id: chatId
    })
    .select();

  if (error) {
    throw new Error(error.message);
  }
  return data[0];
};

export const getLastChat = async (userid: string) => {
  const yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
  const { data, error } = await supabaseClient
    .from('conversations')
    .select()
    .eq('userId', userid)
    .gt('date', yesterday.toISOString())
    .order('date', { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data[0];
};

export const startNewConversation = async (chatId: number, userId: string) => {
  const { systemPrompt, message } = await getChatStarter();
  console.log(`%c Base Prompt: ${systemPrompt}`, 'color: yellow; font-style: italic');
  // create new chat record in DB
  await initChat({ userId, systemPrompt, starterMessage: message, chatId });
  const startMsg = message.replace('{{NAME}}', userId);
  // send instructions
  await sendTextMessage(chatId, CHAT_INSTRUCTIONS, true);
  await sendTextMessage(chatId, startMsg);
};

export const updateConversation = async (id: number, chat: ChatMessages) => {
  const { error } = await supabaseClient
    .from('conversations')
    .update({ id, chat })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

export const updateTokenUsage = async (id: number, tokens?: number) => {
  // don't update tokens if it's 0 or undefined
  if (!tokens) {
    return;
  }
  const { error } = await supabaseClient
    .from('conversations')
    .update({ token_usage: tokens })
    .eq('id', id);

  if (error) {
    throw error;
  }
}
