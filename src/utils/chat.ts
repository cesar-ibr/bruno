import Morphine from "https://deno.land/x/morphine@0.0.1/mod.ts";
import {
  ChatCompletionRequestMessage,
  Configuration,
  OpenAIApi,
} from 'https://esm.sh/openai@3.3.0';
import { post } from './fetch.ts';
import { File, Update } from "../types/telegram.ts"
import { supabaseClient } from "./supabase.ts";

const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_TOKEN') || '';
const TELEGRAM_API = 'https://api.telegram.org/bot'.concat(TELEGRAM_TOKEN);
const TELEGRAM_FILE_API = 'https://api.telegram.org/file/bot'.concat(TELEGRAM_TOKEN);

// Helpful Messages
export const CHAT_INSTRUCTIONS = `
  👋 I'm Bruno and I'm here to help you practice you English. We can talk about any topic! Some <b>tips</b> 👇
  
  🎙 Send me voice notes to practice your speaking.
  
  💭 Ask me how to say something in English. <b>Example:</b> "How can I say <i>recordar</i> in English?".
  
  🤔 Ask me if you don't understand something i said. <b>Example:</b> "What does <i>superlative</i> mean?".
  
  🔁 Select <b>/start</b> from the menu to start a new conversation.
`;

export const ASK_START_CHAT = `Hello! It's been more than 24 hours since our last conversartion. Let's /start a new one.`;

export const CHAT_LIMIT_MESSAGE = `
  We have reached the text limit of this conversation 🫢.
  Let's start a new one! Select /start`
  .replaceAll('  ', '')
  .trim();

const openAIConfig = new Configuration({
  apiKey: Deno.env.get('OPENAI_KEY') ?? '',
});

const openai = new OpenAIApi(openAIConfig);

export interface ChatMessage extends ChatCompletionRequestMessage {
  fileName?: string;
  dateTime?: string;
  score?: number;
  messageId?: number;
}

export interface ChatMessages {
  messages: Array<ChatMessage>;
  [key: string]: any;
}

/**
 * Telegram API
 */

export const capitalizeI = (text = '') => {
  return text.replace(/^i\s|\si\s/gm, ' I ').replaceAll(`i'm`, `I'm`).trim();
};


type TUpdateResult = {
  ok: boolean;
  result: Update[];
}

export const pollBotUpdates = new Morphine<Update[]>((async function* () {
  let offset = 0;
  const url = `${TELEGRAM_API}/getUpdates`;
  while (true) {
    // poll every 10 seconds
    const data = await post(url, { offset, timeout: 10 }) as TUpdateResult;
    const updates = data.result;
    if (updates.length) {
      offset = updates[updates.length - 1].update_id + 1;
      yield data.result;
    }
  }
})());

export const getFileLink = (file: File) => {
  return `${TELEGRAM_FILE_API}/${file.file_path}`;
}

/**
 * OpenAI
 */

export const tokensAprox = (text = '') => {
  return text.split(' ').length * 1.5;
}

export const getChatGPTCompletion = async (messages: ChatCompletionRequestMessage[]): Promise<{
  text: string;
  tokens?: number; // token usage
}> => {
  try {
    const res = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      max_tokens: 256,
      messages,
    });
    const tokens = res.data.usage?.total_tokens;
    const text = res.data.choices[0].message?.content ?? '';
    return { tokens, text };
  } catch (err) {
    throw new Error(`ChatCompletionRequest - ${err?.message}`);
  }
}

/**
 * Supabase
 */

const handleError = (error: any) => {
  console.log(error);
  throw new Error(JSON.stringify(error));
}

export const getChatStarter = async () => {
  const {
    data = [],
    error
  } = await supabaseClient
    .from('lessons')
    .select()
    .order('created_at', { ascending: false });

  if (error) {
    return handleError(error);
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
    return handleError(error);
  }
  return data[0];
};

export const getLastChat = async (chatId: number) => {
  const yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
  const { data, error } = await supabaseClient
    .from('conversations')
    .select()
    .eq('chat_id', chatId)
    .gt('date', yesterday.toISOString())
    .order('date', { ascending: false });
  if (error) {
    return handleError(error);
  }
  return data[0];
};

export const insertNewConversation = async (chatId: number, userId: string) => {
  const { systemPrompt, message } = await getChatStarter();
  console.log(`%cBase Prompt: ${systemPrompt}`, 'color: yellow; font-style: italic');
  // create new chat record in DB
  await initChat({ userId, systemPrompt, starterMessage: message, chatId });
  return message.replace('{{NAME}}', userId);
};

export const updateConversation = async (id: number, chat: ChatMessages) => {
  const { error } = await supabaseClient
    .from('conversations')
    .update({ id, chat })
    .eq('id', id);

  if (error) {
    return handleError(error);
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
    return handleError(error);
  }
}
