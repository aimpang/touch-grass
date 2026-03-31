const MAX_RETRIES = 2;
const TIMEOUT_MS = 8000;

export async function fetchWithTimeout(url, options = {}) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);

      if (res.status === 429) {
        // Rate limited — wait and retry
        const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
        await new Promise((r) => setTimeout(r, retryAfter * 1000 * (attempt + 1)));
        continue;
      }

      return res;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if (err.name === 'AbortError') {
        console.warn(`Fetch timeout (attempt ${attempt + 1}): ${url}`);
      }
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Fetch failed after retries');
}
