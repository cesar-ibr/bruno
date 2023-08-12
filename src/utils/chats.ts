import {
  ChatCompletionRequestMessage,
  Configuration,
  OpenAIApi,
} from 'https://esm.sh/openai@3.3.0';

const openAIConfig = new Configuration({
  apiKey: Deno.env.get('OPENAI_KEY') ?? '',
});

const openai = new OpenAIApi(openAIConfig);

interface IChats {
  [key: string]: {
    messages: ChatCompletionRequestMessage[]
  }
}

// Loading saved chats
const _chats: IChats = JSON.parse(localStorage.getItem('CHATS') || '{}');

type TInitChatParams = {
  userId: string;
  basePrompt: string;
  starterMessage: string;
};
export const initChat = ({
  userId,
  basePrompt,
  starterMessage,
}: TInitChatParams) => {
  const prompt = basePrompt.replace('{{NAME}}', userId).trim();
  const starter = starterMessage.replace('{{NAME}}', userId).trim();
  _chats[userId] = {
    messages: [
      { role: 'system', content: prompt },
      { role: 'assistant', content: starter },
    ]
  };
};

export const getChatHistory = (userId = '') => {
  return _chats[userId];
};

export const appendMessage = (userId: string, message: ChatCompletionRequestMessage) => {
  _chats[userId].messages.push(message);
};

export const capitalizeI = (text = '') => {
  return text.replace(/^i\s|\si\s/gm, ' I ').replaceAll(`i'm`, `I'm`).trim();
};

export const getCompletion = async (userId: string) => {
  const res = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    temperature: 0.5,
    max_tokens: 256,
    messages: _chats[userId].messages,
  });
  // console.log('--- completion:', res.data.choices[0].message);
  return res.data.choices[0].message?.content ?? '';
}

export const saveChats = () => {
  const chatsStr = JSON.stringify(_chats);
  localStorage.setItem('CHATS', chatsStr);
  // Write file
  Deno.writeFileSync('./chats.json', new TextEncoder().encode(chatsStr));
};
