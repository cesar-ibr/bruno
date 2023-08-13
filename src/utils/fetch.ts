export const get = async (url = '/') => {
  const res = await fetch(url);

  if (res.status !== 200) {
    console.log(`%c Error requesting ${url}`, 'color: red');
    throw new Error(res.statusText);
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
    console.log(`%c Error requesting ${url}`, 'color: red');
    throw new Error(res.statusText);
  }
  return await res.json();
};
