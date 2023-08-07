import { HfInference } from "https://esm.sh/@huggingface/inference@2.6.1";

const HF_TOKEN = Deno.env.get('HF_TOKEN') ?? '';
const MODEL_ID = 'jonatasgrosman/wav2vec2-large-xlsr-53-english';
// const MODEL_ID = 'openai/whisper-large-v2';
const filePath = Deno.args[0];
console.log('Using file: ', filePath);

console.log('--- Initializing HF Inference');
const inference = new HfInference(HF_TOKEN);

console.log('--- Infering with model:', MODEL_ID);

const start = Date.now();
const output = await inference.automaticSpeechRecognition({
  data: Deno.readFileSync(filePath),
  model: MODEL_ID,  
});

console.log('OUTPUT:', output.text);
console.log('[Time]', (Date.now() - start) / 1000, 'secs');
