export const get = async (url = '/') => {
  const res = await fetch(url);
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
  return await res.json();
};
