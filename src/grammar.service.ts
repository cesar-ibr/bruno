import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { HfInference } from "https://esm.sh/@huggingface/inference@2.6.1";
import { IGrammarRequest } from "./types/grammar.ts";

const [, portNum] = (Deno.args[0] || '').split('=');
const port = portNum ? Number(portNum) : 8000;

const HF_TOKEN = Deno.env.get('HF_TOKEN') ?? '';
const ROBERTA_COLA = 'textattack/roberta-base-CoLA';
// Models to correct grammar:
// 'vennify/t5-base-grammar-correction'
// 'grammarly/coedit-large'
// 'pszemraj/flan-t5-large-grammar-synthesis';
// Above this threshold sentences contains many grammar errors
const BAD_GRAMMAR_THRESHOLD = 90;

const hf = new HfInference(HF_TOKEN);
const headers = {
  headers: {
    'Content-Type': 'application/json'
  }
};

const getScore = (scores: { label: string, score: number }[]) => {
  const score = scores.find(_score => _score.label === 'LABEL_0')?.score || BAD_GRAMMAR_THRESHOLD;
  return Math.round(score * 100);
};

const handler = async (req: Request) => {
  // receive text
  const { input = '' } = await req.json() as IGrammarRequest;

  // classify grammar
  console.log(`%cInput: "${input}"`, "color: yellow");
  if (!input || typeof input !== 'string') {
    return new Response('Input is required', { status: 400 });
  }

  console.time('TIME');
  const results = await hf.textClassification({
    model: ROBERTA_COLA,
    inputs: input,
  });
  const inputScore = getScore(results);
  console.log(`%cInput Score: ${inputScore}`, "font-weight: bold");
  console.timeEnd('TIME');

  return new Response(JSON.stringify({
    input,
    label: inputScore > BAD_GRAMMAR_THRESHOLD ? 'BAD' : 'ACCEPTABLE',
    score: inputScore
  }), headers);

  // console.log('Fixing grammar...');
  // console.time('TIME');
  // const { generated_text } = await hf.textGeneration({
  //   model: GRAMMAR_FIX_MODEL,
  //   inputs: input,
  //   parameters: { max_new_tokens: 250 }
  // });

  // console.log(`%cOutput: "${generated_text}"`, "color: blue");
  // console.timeEnd('TIME');
};

try {
  serve(handler, { port });
} catch (err) {
  console.error(err);
}
