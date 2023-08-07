/*
Run:
deno run --allow-read --allow-write --allow-run --allow-env convert.ts ./voice_notes/cesar_ibr-AgAD7B4AAoAYeFI.ogg new-audio.wav
*/
const filePath = Deno.args[0];
const outPath = Deno.args[1];

console.log('Input File: ', filePath);
console.log('Output File:', outPath);

const ffmpegPath = Deno.env.get('HOME') ?? '';
const cmd = new Deno.Command(ffmpegPath.concat('/ffmpeg'), {
  args: [
    '-i',
    filePath,
    '-vn',
    '-ar',
    '16000',
    outPath
  ]
});

const { stdout } = cmd.outputSync();
const out = new TextDecoder().decode(stdout);
console.log(out);
