const TOKEN = Deno.env.get('TELEGRAM_TOKEN') || '';
const BOT_API = 'https://api.telegram.org/bot'.concat(TOKEN);
const BOT_FILE_API = 'https://api.telegram.org/file/bot'.concat(TOKEN);

export const get = async (path = '/') => {
  const res = await fetch(BOT_API.concat(path));
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description);
  }

  return data;
};

export const getFile = async (fileId = '') => {
  const res = await get('/getFile?file_id='.concat(fileId));

  if (res.ok && res.result?.file_path) {
    const url = `${BOT_FILE_API}/${res.result.file_path}`;
    console.log('--- audio url: ', url);
    return fetch(url);
  }
};

export const post = async (path = '/', payload = {}) => {
  const res = await fetch(BOT_API.concat(path), {
    method: 'POST',
    headers: {
      "content-type": "application/json",
      connection: "keep-alive",
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description);
  }

  return data;
};
