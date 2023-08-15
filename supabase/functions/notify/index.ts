import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CHAT_ID = Deno.env.get('CHAT_ID') ?? '0';
const NOTIFY_BOT_API = Deno.env.get('NOTIFY_BOT_API') ?? '';
const MESSAGE_TEMPLATE = '🚨 Something is not working 😬';

serve(async (req) => {
  const {
    message = '',
    userId = '',
    chatId = '' // this is the user's chatId
  } = await req.json();

  const text = `${MESSAGE_TEMPLATE}\n<i>${message}</i>\n\n<b>chat:</b> ${chatId}\n<b>user:</b> ${userId}`;

  const payload = {
    chat_id: Number(CHAT_ID),
    text,
    parse_mode: 'HTML'
  };

  console.log('payload:', payload);
  // send telegram message
  const res = await fetch(NOTIFY_BOT_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  return new Response(
    res.body,
    {
      status: res.status,
      statusText: res.statusText,
      headers: {
        'Content-Type': 'application/json',
        ...res.headers
      },
    },
  );
});
