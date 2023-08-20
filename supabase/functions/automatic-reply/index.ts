import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.17.2/mod.ts";


const CHAT_ID = Deno.env.get('CHAT_ID') ?? '0';
const NOTIFY_BOT_API = Deno.env.get('NOTIFY_BOT_API') ?? '';
const AUTOMATIC_RESPONSE = `I'm not available at the moment 😴. I'll reply later when I wake up.`;
const bot = new Bot(Deno.env.get('TELEGRAM_TOKEN') || '');

console.log(`Function "telegram-bot" up and running!`);

// bot.command('start', (ctx) => ctx.reply('Welcome! Up and running.'))
// bot.command('ping', (ctx) => ctx.reply(`Pong! ${new Date()} ${Date.now()}`))
bot.on('message', async (ctx) => {
  const { chat, from, message } = ctx;
  await ctx.reply(AUTOMATIC_RESPONSE);
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

const handleUpdate = webhookCallback(bot, 'std/http')

serve(async (req) => {
  try {
    return await handleUpdate(req)
  } catch (err) {
    console.error(err)
  }
})
