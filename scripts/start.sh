# kick off ASR service
nohup deno run --allow-net --allow-env --allow-read --allow-write ./src/asr.service.ts port=8001 & disown
# kick off Grammar Service
nohup deno run --allow-net --allow-env ./src/grammar.service.ts port=8000 & disown
# kick off Chat service
nohup deno run --allow-env --allow-net --allow-write ./src/chat.server.ts & disown
