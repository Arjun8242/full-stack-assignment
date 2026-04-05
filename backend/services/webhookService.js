import axios from 'axios';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Sleep helper.
 * @param {number} ms
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Send a POST request to the given URL with exponential backoff retry.
 * @param {string} url
 * @param {object} payload
 * @param {number} attempt - current attempt (1-indexed)
 */
const postWithRetry = async (url, payload, attempt = 1) => {
  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 8000
    });
    console.log(
      `[WEBHOOK] Delivered successfully on attempt ${attempt} — status ${response.status}`
    );
    return true;
  } catch (error) {
    const status = error.response?.status ?? 'network error';
    console.error(
      `[WEBHOOK] Attempt ${attempt} failed (${status}): ${error.message}`
    );

    if (attempt >= MAX_RETRIES) {
      console.error(
        `[WEBHOOK] All ${MAX_RETRIES} attempts exhausted. Giving up.`
      );
      return false;
    }

    const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
    console.log(`[WEBHOOK] Retrying in ${delay}ms (attempt ${attempt + 1})...`);
    await sleep(delay);
    return postWithRetry(url, payload, attempt + 1);
  }
};

/**
 * Fire-and-forget: send task-completion webhook if WEBHOOK_URL is configured.
 * Payload: { taskId, title, completedAt, userId }
 * @param {import('mongoose').Document} task
 */
export const sendCompletionWebhook = (task) => {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    console.log(
      '[WEBHOOK] WEBHOOK_URL not set — skipping completion notification.'
    );
    return;
  }

  const payload = {
    taskId: task._id.toString(),
    title: task.title,
    completedAt: new Date().toISOString(),
    userId: task.ownerId
  };

  console.log(
    `[WEBHOOK] Task "${task.title}" completed — posting to ${webhookUrl}`
  );

  // Non-blocking: run in background
  postWithRetry(webhookUrl, payload).catch((err) => {
    console.error('[WEBHOOK] Unexpected error:', err.message);
  });
};
