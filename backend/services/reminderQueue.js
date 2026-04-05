import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';

// ─── Redis connection ─────────────────────────────────────────────────────────

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let redisAvailable = false;
let reminderQueue = null;
let reminderWorker = null;
let reminderQueueEvents = null;

/** In-memory fallback: Map<taskId, timeoutId> */
const memoryTimers = new Map();

const makeRedisConnection = () =>
  new IORedis(REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: false });

// ─── Check Redis availability ─────────────────────────────────────────────────

const checkRedis = async () => {
  try {
    const client = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true
    });
    await client.connect();
    await client.ping();
    await client.quit();
    return true;
  } catch {
    return false;
  }
};

// ─── Reminder handler (shared by both BullMQ worker and in-memory fallback) ──

const handleReminder = async (data) => {
  const { taskId, title, dueDate, ownerId } = data;

  console.log(
    `\n[REMINDER] ⏰  Task "${title}" (ID: ${taskId}, owner: ${ownerId}) is due in ~1 hour! Due: ${dueDate}\n`
  );

  const reminderWebhookUrl = process.env.REMINDER_WEBHOOK_URL;
  if (reminderWebhookUrl) {
    try {
      await axios.post(
        reminderWebhookUrl,
        { taskId, title, dueDate, ownerId, triggeredAt: new Date().toISOString() },
        { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
      );
      console.log(`[REMINDER] Notification posted to ${reminderWebhookUrl}`);
    } catch (err) {
      console.error(`[REMINDER] Webhook POST failed: ${err.message}`);
    }
  }
};

// ─── BullMQ queue getter ──────────────────────────────────────────────────────

const getReminderQueue = () => {
  if (!reminderQueue) {
    reminderQueue = new Queue('task-reminders', {
      connection: makeRedisConnection(),
      defaultJobOptions: { removeOnComplete: true, removeOnFail: 50 }
    });
  }
  return reminderQueue;
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialize the worker. BullMQ if Redis is up, otherwise in-memory fallback.
 */
export const initReminderWorker = async () => {
  redisAvailable = await checkRedis();

  if (redisAvailable) {
    reminderWorker = new Worker('task-reminders', (job) => handleReminder(job.data), {
      connection: makeRedisConnection(),
      concurrency: 5
    });

    reminderWorker.on('completed', (job) => {
      console.log(`[REMINDER] Job ${job.id} completed.`);
    });

    reminderWorker.on('failed', (job, err) => {
      console.error(`[REMINDER] Job ${job?.id} failed: ${err.message}`);
    });

    reminderQueueEvents = new QueueEvents('task-reminders', {
      connection: makeRedisConnection()
    });

    console.log('[REMINDER] BullMQ worker started (Redis connected).');
  } else {
    console.log('[REMINDER] Redis not available — using in-memory setTimeout fallback.');
  }
};

/**
 * Schedule a reminder 1 hour before due date.
 */
export const scheduleReminder = async (task) => {
  if (!task.dueDate) return;

  const taskId = task._id.toString();
  const due = new Date(task.dueDate);
  const delay = Math.max(0, due.getTime() - Date.now() - 60 * 60 * 1000);

  // Always cancel existing first
  await cancelReminder(taskId);

  const jobData = {
    taskId,
    title: task.title,
    dueDate: due.toISOString(),
    ownerId: task.ownerId
  };

    if (redisAvailable) {
      const queue = getReminderQueue();
      await queue.add('reminder', jobData, {
        delay,
        jobId: `reminder-${taskId}`
      });
    } else {
    // In-memory fallback
    const timerId = setTimeout(() => {
      memoryTimers.delete(taskId);
      handleReminder(jobData).catch((err) =>
        console.error('[REMINDER] In-memory handler error:', err.message)
      );
    }, delay);
    memoryTimers.set(taskId, timerId);
  }

  const fireAt = new Date(Date.now() + delay);
  console.log(
    `[REMINDER] Scheduled for task "${task.title}" (ID: ${taskId}) — fires at ${fireAt.toISOString()} (${redisAvailable ? 'BullMQ' : 'in-memory'})`
  );
};

/**
 * Cancel a scheduled reminder.
 */
export const cancelReminder = async (taskId) => {
    if (redisAvailable) {
      try {
        const queue = getReminderQueue();
        const jobId = `reminder-${taskId}`;
        const existing = await queue.getJob(jobId);
        if (existing) {
          await existing.remove();
        console.log(`[REMINDER] Cancelled BullMQ reminder for task ${taskId}`);
      }
    } catch (err) {
      console.error(`[REMINDER] Failed to cancel BullMQ job: ${err.message}`);
    }
  }

  // Always clear in-memory too (in case of fallback)
  if (memoryTimers.has(taskId)) {
    clearTimeout(memoryTimers.get(taskId));
    memoryTimers.delete(taskId);
    console.log(`[REMINDER] Cancelled in-memory reminder for task ${taskId}`);
  }
};

/**
 * Reschedule (cancel old + schedule new).
 */
export const rescheduleReminder = async (task) => {
  if (!task.dueDate) {
    await cancelReminder(task._id.toString());
    return;
  }
  await scheduleReminder(task);
};

/**
 * On server startup, re-schedule reminders for all pending tasks with future due dates.
 */
export const initializeReminders = async () => {
  const { default: Task } = await import('../models/Task.js');

  const now = new Date();
  const pendingTasks = await Task.find({
    status: 'pending',
    dueDate: { $gt: now }
  });

  let scheduled = 0;
    for (const task of pendingTasks) {
      if (redisAvailable) {
        const queue = getReminderQueue();
        const jobId = `reminder-${task._id.toString()}`;
        const existing = await queue.getJob(jobId);
        if (existing) continue; // already queued
      }
    await scheduleReminder(task);
    scheduled++;
  }

  console.log(
    `[REMINDER] Initialized: ${scheduled} reminders scheduled from ${pendingTasks.length} pending tasks.`
  );
};

/**
 * Gracefully close connections.
 */
export const closeReminderQueue = async () => {
  // Clear all in-memory timers
  for (const [, timerId] of memoryTimers) {
    clearTimeout(timerId);
  }
  memoryTimers.clear();

  // Close BullMQ connections
  await reminderWorker?.close();
  await reminderQueue?.close();
  await reminderQueueEvents?.close();
};
