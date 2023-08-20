
const throwError = (res: Response, method = 'GET') => {
  console.log(`%c${method} ${res.url}`, 'color: red');
  throw new Error(`HTTP ${res.status} - ${res.statusText }`);
};

export const get = async (url = '/') => {
  const res = await fetch(url);

  if (res.status !== 200) {
    throwError(res);
  }
  return await res.json();
};

export const post = async (url = '/', payload = {}) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      "content-type": "application/json",
      connection: "keep-alive",
    },
    body: JSON.stringify(payload)
  });

  if (res.status !== 200) {
    throwError(res, 'POST');
  }
  return await res.json();
};
