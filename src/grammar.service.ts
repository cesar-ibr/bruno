import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { HfInference } from "https://esm.sh/@huggingface/inference@2.6.1";
import { IGrammarRequest } from "./types/services.ts";

const [, portNum] = (Deno.args[0] || '').split('=');
const port = portNum ? Number(portNum) : 8000;

const HF_TOKEN = Deno.env.get('HF_TOKEN') ?? '';
const ROBERTA_COLA = 'textattack/roberta-base-CoLA';
// Below this threshold sentences contain grammar errors
const GRAMMAR_THRESHOLD = 15;

const hf = new HfInference(HF_TOKEN);
const headers = {
  headers: {
    'Content-Type': 'application/json'
  }
};

const log = (message = '', color = 'white') => {
  console.log(`%c[Grammar Service]${message}`, `color: ${color}`)
}

const getScore = (scores: { label: string, score: number }[]) => {
  const score = scores.find(_score => _score.label === 'LABEL_1')?.score || GRAMMAR_THRESHOLD;
  return Math.round(score * 100);
};

const handler = async (req: Request) => {
  // receive text
  const { input = '' } = await req.json() as IGrammarRequest;

  // classify grammar
  log(`%cInput: "${input}"`, 'yellow');
  if (!input || typeof input !== 'string') {
    return new Response('Input is required', { status: 400 });
  }

  console.time('TIME');
  const results = await hf.textClassification({
    model: ROBERTA_COLA,
    inputs: input,
  });
  const inputScore = getScore(results);
  log(`%cInput Score: ${inputScore}`, 'white;font-weight: bold');
  console.timeEnd('TIME');

  return new Response(JSON.stringify({
    input,
    label: inputScore < GRAMMAR_THRESHOLD ? 'BAD' : 'OKAY',
    score: inputScore
  }), headers);
};

try {
  serve(handler, { port });
} catch (err) {
  console.error(err);
}
