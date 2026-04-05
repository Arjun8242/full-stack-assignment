import Task from '../models/Task.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  scheduleReminder,
  cancelReminder,
  rescheduleReminder
} from '../services/reminderQueue.js';
import { sendCompletionWebhook } from '../services/webhookService.js';

const allowedUpdates = ['title', 'description', 'dueDate', 'status', 'category', 'tags'];

// ─── Create ───────────────────────────────────────────────────────────────────

export const createTask = asyncHandler(async (req, res) => {
  const task = await Task.create({
    ownerId: req.user.id,
    title: req.body.title,
    description: req.body.description ?? '',
    dueDate: req.body.dueDate ?? null,
    status: req.body.status ?? 'pending',
    category: req.body.category ?? null,
    tags: req.body.tags ?? []
  });

  // Schedule a BullMQ reminder if dueDate is provided
  if (task.dueDate) {
    await scheduleReminder(task);
  }

  res.status(201).json({ success: true, task });
});

// ─── List (with optional filter) ─────────────────────────────────────────────

export const getTasks = asyncHandler(async (req, res) => {
  const filter = { ownerId: req.user.id };

  // ?category=Work
  if (req.query.category) {
    filter.category = req.query.category;
  }

  // ?tags=High Priority,Client A  OR  ?tags[]=High Priority&tags[]=Client A
  if (req.query.tags) {
    const rawTags = Array.isArray(req.query.tags)
      ? req.query.tags
      : req.query.tags.split(',').map((t) => t.trim()).filter(Boolean);

    if (rawTags.length > 0) {
      // Tasks that contain ALL specified tags
      filter.tags = { $all: rawTags };
    }
  }

  const tasks = await Task.find(filter).sort({ createdAt: -1 });

  res.json({ success: true, count: tasks.length, tasks });
});

// ─── Get One ─────────────────────────────────────────────────────────────────

export const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, ownerId: req.user.id });
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  res.json({ success: true, task });
});

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateTask = asyncHandler(async (req, res) => {
  // Fetch the document before updating so we can compare fields
  const existing = await Task.findOne({ _id: req.params.id, ownerId: req.user.id });
  if (!existing) {
    throw new AppError('Task not found', 404);
  }

  const updates = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user.id },
    updates,
    { new: true, runValidators: true }
  );

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // ── Reminder logic ──────────────────────────────────────────────────────────
  const dueDateChanged =
    updates.dueDate !== undefined &&
    String(existing.dueDate) !== String(task.dueDate);

  const justCompleted =
    updates.status === 'completed' && existing.status !== 'completed';

  if (justCompleted) {
    // Task done — cancel any pending reminder and fire the completion webhook
    await cancelReminder(task._id.toString());
    sendCompletionWebhook(task); // fire-and-forget with retry
  } else if (dueDateChanged) {
    // dueDate changed (or cleared) — reschedule / cancel reminder
    await rescheduleReminder(task);
  }

  res.json({ success: true, task });
});

// ─── Delete ───────────────────────────────────────────────────────────────────

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Cancel any scheduled reminder
  await cancelReminder(task._id.toString());

  res.json({ success: true, message: 'Task deleted successfully' });
});
