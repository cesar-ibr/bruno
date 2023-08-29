import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Bot, InlineKeyboard, InputFile, webhookCallback } from "https://deno.land/x/grammy@v1.17.2/mod.ts";
import { post } from "../_shared/fetch.ts";


const CHAT_ID = Deno.env.get('CHAT_ID') ?? '0';
const NOTIFY_BOT_API = Deno.env.get('NOTIFY_BOT_API') ?? '';
const AUTOMATIC_RESPONSE = `I'm not available at the moment 😴. I'll reply later when I wake up.`;
const bot = new Bot(Deno.env.get('TELEGRAM_TOKEN') || '');
const TTS_API_URL = Deno.env.get('TTS_API') ?? '';

console.log(`Function "telegram-bot" up and running!`);


const getAudio = async (text: string, id: number) => {
  console.log('%cGenerating Audio...', 'color: pink');
  console.time('TTS_TIME');
  const { filePath = '' } = await post(TTS_API_URL, { text, messageId: id });
  console.timeEnd('TTS_TIME');
  return filePath;
};

bot.on('message', async (ctx) => {
  const { chat, from, message } = ctx;
  const inlineKyb = new InlineKeyboard().text('🔈', '[TTS]');
  await ctx.reply(AUTOMATIC_RESPONSE, { reply_markup: inlineKyb });
  await fetch(NOTIFY_BOT_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: Number(CHAT_ID),
      text: `📩 New Message Received.\nChat: ${chat.id}\nName: ${from.first_name}\nMessage:${message.text || 'Probably Audio'}`
    })
  });
});

/** Handle Text to Speech */
bot.on('callback_query:data', async (ctx) => {
  // Handle Text-to-Speech only
  if (ctx.callbackQuery.data !== '[TTS]' || !ctx.chat?.id) {
    return await ctx.answerCallbackQuery();
  }

  await ctx.api.sendChatAction(ctx.chat?.id, 'record_voice');
  const text = ctx.message?.text ?? '';
  const audioFile = await getAudio(text, ctx.message?.message_id ?? 123);
  // send text to audio service
  await ctx.answerCallbackQuery(); // remove loading animaiton
  // send audio
  await ctx.replyWithAudio(new InputFile(audioFile));
});

const handleUpdate = webhookCallback(bot, 'std/http')

serve(async (req) => {
  try {
    return await handleUpdate(req)
  } catch (err) {
    console.error(err)
  }
})
