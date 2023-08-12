import { HfInference } from "https://esm.sh/@huggingface/inference@2.6.1";

const HF_TOKEN = Deno.env.get('HF_TOKEN') ?? '';
const ROBERTA_COLA = 'textattack/roberta-base-CoLA';
const GRAMMAR_FIX_MODEL = 'pszemraj/flan-t5-large-grammar-synthesis';

const GRAMMAR_THRESHOLD = 90;

const input = Deno.args[0] || '';
const hf = new HfInference(HF_TOKEN);

const getScore = (scores: { label: string, score: number }[]) => {
  const score = scores.find(_score => _score.label === 'LABEL_0')?.score || GRAMMAR_THRESHOLD;
  return Math.round(score * 100); // transform to two decimals
};

const text = input.replaceAll('"', '').trim();
console.log(`%c Text: ${text}`, "font-style: italic");
console.log('%cChecking grammar...', 'color: blue; font-style: italic');

console.time('TIME');
const results = await hf.textClassification({
  model: ROBERTA_COLA,
  inputs: text,
});

console.log('Results:', results);
const inputScore = getScore(results);
console.log(`%cInput Score: ${inputScore}`, "font-weight: bold");
console.timeEnd('TIME');

console.log('%c"Fixing" grammar...', 'color: blue; font-style: italic');

console.time('TIME');
const { generated_text } = await hf.textGeneration({
  model: GRAMMAR_FIX_MODEL,
  inputs: text
});

console.log(`%cOutput: "${generated_text}"`, "color: yellow");
console.timeEnd('TIME');



