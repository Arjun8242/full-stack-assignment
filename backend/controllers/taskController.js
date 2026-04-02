import Task from '../models/Task.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const allowedUpdates = ['title', 'description', 'dueDate', 'status'];

export const createTask = asyncHandler(async (req, res) => {
  const task = await Task.create({
    ownerId: req.user.id,
    title: req.body.title,
    description: req.body.description ?? '',
    dueDate: req.body.dueDate ?? null,
    status: req.body.status ?? 'pending'
  });

  res.status(201).json({
    success: true,
    task
  });
});

export const getTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ ownerId: req.user.id }).sort({ createdAt: -1 });

  res.json({
    success: true,
    tasks
  });
});

export const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, ownerId: req.user.id });
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  res.json({
    success: true,
    task
  });
});

export const updateTask = asyncHandler(async (req, res) => {
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

  res.json({
    success: true,
    task
  });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
});
