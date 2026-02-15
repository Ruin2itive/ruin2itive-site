/**
 * Shared fetch utilities with retry logic for network resilience
 */

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic (3 attempts with exponential backoff)
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {number} retries - Maximum number of retries
 * @returns {Promise<Response>} - Fetch Response object
 * @throws {Error} - Throws error if all retries are exhausted
 */
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  // Set default User-Agent if not provided
  const defaultOptions = {
    redirect: "follow",
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ruin2itive-bot/1.0)',
      ...(options.headers || {})
    },
    ...options
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, defaultOptions);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      return res;
    } catch (err) {
      if (attempt === retries) {
        throw err;
      }
      console.warn(`Attempt ${attempt}/${retries} failed: ${err.message}. Retrying in ${RETRY_DELAY_MS * attempt}ms...`);
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
}

/**
 * Fetch and return text with retry logic
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<string>} - Response text
 * @throws {Error} - Throws error if all retries are exhausted
 */
async function fetchTextWithRetry(url, options = {}) {
  const res = await fetchWithRetry(url, options);
  return res.text();
}

/**
 * Fetch and return JSON with retry logic
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<object>} - Parsed JSON response
 * @throws {Error} - Throws error if all retries are exhausted
 */
async function fetchJsonWithRetry(url, options = {}) {
  const res = await fetchWithRetry(url, options);
  return res.json();
}

module.exports = {
  fetchWithRetry,
  fetchTextWithRetry,
  fetchJsonWithRetry,
  sleep
};
