import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Bot } from "https://deno.land/x/grammy@v1.17.2/mod.ts";
import { logger } from './utils/logger.ts';
import { getChatGPTCompletion } from './utils/chat.ts';
import { IFeedbackRequest, IFeedbackRequestMessage } from './types/services.ts';


const [, portNum] = (Deno.args[0] || '').split('=');
const port = portNum ? Number(portNum) : 8000;
const headers = {
  'Content-Type': 'application/json'
};

const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_TOKEN') || '';
const PROMPT = `Give me a corrected version of the following text:"{{}}"`;
const FEEDBACK_TEMPLATE = `
  Based on the messages you sent me during our last conversation 💬, here are a few suggestions to sound more natural👇.`
  .trim();
const bot = new Bot(TELEGRAM_TOKEN);

// Util Fns
const log = logger('FEEDBACK');

const getCorrectedMessage = async (message: IFeedbackRequestMessage) => {
  const correctedText = await getChatGPTCompletion([
    { role: 'user', content: PROMPT.replace('{{}}', message.text) }
  ]);
  return { ...message, text: correctedText.text };
};

const handler = async (req: Request) => {
  // receive messages
  const { chatId = 0, messages } = await req.json() as IFeedbackRequest;

  if (!messages || !messages.length) {
    log(`No messages received`, 'yellow');
    return new Response(
      JSON.stringify({ message: 'Missing "messages" parameter' }),
      { headers, status: 400 }
    );
  }

  log(`Getting feedback for chat: ${chatId}`);
  bot.api.sendChatAction(chatId, 'typing');
  console.time('TIME');
  // getting corrected messages
  const correctedMessages = await Promise.all(messages.map(getCorrectedMessage));
  console.log('Corrected:', correctedMessages);
  // send messages to chat
  await bot.api.sendMessage(chatId, FEEDBACK_TEMPLATE);
  await Promise.all(correctedMessages.map((msg) => {
    return bot.api.sendMessage(
      chatId,
      `Alternative: ${msg.text}`,
      {
        reply_to_message_id: msg.messageId || 0,
        allow_sending_without_reply: true
      }
    );
  }))
  console.timeEnd('TIME');

  return new Response(
    JSON.stringify({ messages: correctedMessages }),
    { headers }
  );
};

// Run server
serve(
  handler,
  { port })
  .catch((reason) => log(`Error - Handler Failed: ${reason}`, 'red'));
