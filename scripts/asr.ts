import { HfInference } from "https://esm.sh/@huggingface/inference@2.6.1";

const HF_TOKEN = Deno.env.get('HF_TOKEN') ?? '';
const MODEL_ID = 'jonatasgrosman/wav2vec2-large-xlsr-53-english';
// const MODEL_ID = 'openai/whisper-large-v2';
// const endpoint = 'https://rjj58r7jgs3q2wet.us-east-1.aws.endpoints.huggingface.cloud';
const filePath = Deno.args[0];
console.log('Using file: ', filePath);

console.log('--- Initializing HF Inference');
const inference = new HfInference(HF_TOKEN);

// console.log('--- Infering with model:', MODEL_ID);
// console.log('--- Endpoint:', endpoint);

console.time('TIME');
const output = await inference.automaticSpeechRecognition({
  data: Deno.readFileSync(filePath),
  model: MODEL_ID,  
});

// const model =  hf.endpoint(endpoint);
console.log('%c Infering...', 'color: blue');
// data: Deno.readFileSync(filePath),
// const output = await model.request({ parameters});
// const res = await fetch(endpoint, {
//   method: 'POST',
//   body: Deno.readFileSync(filePath),
//   headers: {
//     'Authorization': `Bearer ${HF_TOKEN}`,
//     'Content-Type': 'audio/ogg',
//   }
// });

// const output = await res.json();
console.log(`%c OUTPUT: ${output.text}`, 'color: yellow');

console.timeEnd('TIME');
