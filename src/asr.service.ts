import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { HfInference } from "https://esm.sh/@huggingface/inference@2.6.1";
import { capitalizeI } from "./utils/chats.ts";
import { supabaseClient } from "./utils/supabase.ts";

const HF_TOKEN = Deno.env.get('HF_TOKEN') ?? '';
// const MODEL_ID = 'jonatasgrosman/wav2vec2-large-xlsr-53-english';
const MODEL_ID = 'openai/whisper-medium';
const AUDIO_FOLDER = './voice_notes/';
const [, portNum] = (Deno.args[0] || '').split('=');
const port = portNum ? Number(portNum) : 8000;

const hf = new HfInference(HF_TOKEN);

// HTTP Helpers
const headers = {
  'Content-Type': 'application/json'
};

const errorResponse = (error = '', code = 500) => {
  console.log(`%c${error}`, 'color: red');
  return new Response(
    JSON.stringify({ error }),
    { status: code, headers }
  );
};

type TRequest = {
  link: string;
};

const handler = async (req: Request): Promise<Response> => {
  // receive download link
  const { link = '' } = await req.json() as TRequest;
  if (!link) {
    return errorResponse('Download link is missing', 400);
  }

  const fileName = link.replace('.oga', '.ogg').split('/').findLast(Boolean) ?? 'audio.ogg';
  const filePath = AUDIO_FOLDER.concat(fileName);
  const shouldDownload = link.startsWith('http');
  console.log(`%c Using file from: ${link}`, 'color: yellow');

  // Download audio file
  if (shouldDownload) {
    console.log(`%c --- Saving at ${filePath}`, 'color: yellow');
  
    const destFile = await Deno.open(filePath, {
      create: true,
      write: true,
      truncate: true,
    });
    
    const res = await fetch(link);
    if (res.status !== 200) {
      return errorResponse('Audio file not found', 404);
    }
    console.time('TIME');
    await res.body?.pipeTo(destFile.writable);
    console.timeEnd('TIME');
  }

  // open file for inference
  console.log('Transcribing...');
  console.time('TIME');

  const output = await hf.automaticSpeechRecognition({
    data: Deno.readFileSync(shouldDownload ? filePath : link),
    model: MODEL_ID,
  });

  const text = capitalizeI(output.text);
  console.log(`%cOutput: ${text}`, 'color: #31AFDE; font-style: italic');
  console.timeEnd('TIME');

  // Save in DB avoiding `await`
  if (shouldDownload) {
    supabaseClient.from('asr_output').insert({ output: text, file: fileName });
  }

  // send result
  return new Response(JSON.stringify({ ok: true, text, fileName }), { headers });
};

try {
  serve(handler, { port });
} catch (err) {
  console.error(err);
}