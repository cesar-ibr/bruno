import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { HfInference } from "https://esm.sh/@huggingface/inference@2.6.1";
import { logger } from './utils/logger.ts';

const HF_TOKEN = Deno.env.get('HF_TOKEN') ?? '';
// const MODEL_ID = 'Voicemod/fastspeech2-en-male1';
const MODEL_ID = 'espnet/english_male_ryanspeech_fastspeech2';
const AUDIO_FOLDER = './bruno_audio/';
const [, portNum] = (Deno.args[0] || '').split('=');
const port = portNum ? Number(portNum) : 8004;

const hf = new HfInference(HF_TOKEN);

// HTTP Helpers
const headers = {
  'Content-Type': 'application/json'
};

const log = logger('TTS');

const errorResponse = (error = '', code = 500) => {
  log(error, 'red');
  return new Response(
    JSON.stringify({ error }),
    { status: code, headers }
  );
};

type TRequest = {
  text: string;
  messageId: string;
};

const handler = async (req: Request): Promise<Response> => {
  // receive download link
  const { text, messageId } = await req.json() as TRequest;
  if (!text) {
    return errorResponse('Download link is required', 400);
  }

  const fileName = `audio_${messageId}.mp3`;
  const filePath = AUDIO_FOLDER.concat(fileName);
  log(`Text: ${text}`, 'yellow');

  // transforming text to audio
  log('Infering...');
  console.time('TIME');

  const result = await hf.textToSpeech({ inputs: text, model: MODEL_ID });
  const buffer = await result.arrayBuffer();
  await Deno.writeFile(filePath, new Uint8Array(buffer))

  console.timeEnd('TIME');  
  log(`Done! File: ${filePath}`, '#31AFDE');

  // send result
  return new Response(JSON.stringify({ ok: true, filePath }), { headers });
};

try {
  serve(handler, { port });
} catch (err) {
  console.error(err);
}