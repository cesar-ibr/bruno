import Morphine from "https://deno.land/x/morphine@0.0.1/mod.ts";
import { HfInference } from "https://esm.sh/@huggingface/inference@2.6.1";
import { get, getFile, post } from "./utils/fetch.ts";

// constants
const HF_TOKEN = Deno.env.get('HF_TOKEN') ?? '';
// const MODEL_ID = 'openai/whisper-large-v2';
const MODEL_ID = 'jonatasgrosman/wav2vec2-large-xlsr-53-english';

// types
interface IUser {
  id: number,
  is_bot: boolean,
  first_name: string,
  last_name: string,
  username: string,
  language_code: string // 'en'
}

interface IUpdate {
  update_id: number;
  message: {
    date: number;
    from: IUser;
    text?: string;
    voice?: {
      file_id: string;
      mime_type: string;
      file_unique_id: string;
      file_size: number;
      duration: number;
    }
    chat: {
      id: number;
      type: 'private' | 'group' | 'supergroup' | 'channel',
      username?: string;
    }
  }
}

interface IUpdateResult {
  ok: boolean;
  result: IUpdate[];
}

// Test Server Connection
try {
  await get('/getMe'); // throws error if response ok is not true
  console.log('🎉 Login Successful!');
} catch (err) {
  console.error('Login Failed ❗️', err);
}

// Test HF token
const inference = new HfInference(HF_TOKEN);

// Iterator for async polling
const pollBotUpdates = new Morphine<IUpdate[]>((async function*() {
  let offset = 0;
  while (true) {
    // poll every 10 seconds
    const data = await post('/getUpdates', { offset, timeout: 10 }) as IUpdateResult;
    const updates = data.result;
    if (updates.length) {
      offset = updates[updates.length - 1].update_id + 1;
      yield data.result;
    }
  }
})());

const saveAudioFile = async (fileId = '', filePath = '') => {
  const fileReq = await getFile(fileId);
  if (!fileReq) {
    throw new Error('[Download File] Request Failed');
  }

  const destFile = await Deno.open(filePath, {
    create: true,
    write: true,
    truncate: true,
  });
  await fileReq.body?.pipeTo(destFile.writable);
};

const infereText = async (filePath = '') => {
  const output = await inference.automaticSpeechRecognition({
    data: Deno.readFileSync(filePath),
    model: MODEL_ID,  
  });
  return output.text;
};

console.log('=== Polling new messages...');
for await (const updates of pollBotUpdates) {
  for (const { message } of updates) {
    const { username } = message.from;
    const chat_id = message.chat.id;

    if (message.text) {
      console.log(`${username}: ${message.text}`);
      continue;
    }
    // Process Voice Note
    if (message.voice) {
      console.log(`${username}: Voice Note`);
      const { file_id } = message.voice;
      const filePath = `./voice_notes/${username}-${Date.now()}.ogg`;
      // 1) Save audio file locally.
      console.time('[Save Audio]');
      await saveAudioFile(file_id, filePath);
      console.timeEnd('[Save Audio]');
      // send 'typing...' every 7 seconds
      const intvl = setInterval(() => post('/sendChatAction', { chat_id, action: 'typing' }), 7000);
      // 2) Send for Inference
      console.log('--- transcribing...');
      console.time('[Inference Time]')
      const text = await infereText(filePath);
      clearInterval(intvl);
      console.timeEnd('[Inference Time]');
      // 3) Reply with infered text
      console.log(`bruno bot: ${text}`);
      const payload = { text, chat_id };
      const res = await post('/sendMessage', payload);
      if (!res.ok) {
        console.error('Error sending message - ', res);
      }
    }
  }
}
