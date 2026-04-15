import Tag from '../models/Tag.js';
import Task from '../models/Task.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const normalizeTagName = (name) => name.trim();

// Upsert helper used by task create/update to keep a manageable tag catalog.
export const ensureTagsExist = async (ownerId, tags = []) => {
  const normalized = [...new Set(tags.map(normalizeTagName).filter(Boolean))];
  if (normalized.length === 0) return;

  await Promise.all(
    normalized.map((name) =>
      Tag.updateOne(
        { ownerId, name },
        { $setOnInsert: { ownerId, name } },
        { upsert: true }
      )
    )
  );
};

export const createTag = asyncHandler(async (req, res) => {
  const name = normalizeTagName(req.body.name);

  const existing = await Tag.findOne({ ownerId: req.user.id, name });
  if (existing) {
    throw new AppError('Tag already exists', 400);
  }

  const tag = await Tag.create({
    ownerId: req.user.id,
    name
  });

  res.status(201).json({ success: true, tag });
});

export const getTags = asyncHandler(async (req, res) => {
  const tags = await Tag.find({ ownerId: req.user.id }).sort({ name: 1 });
  res.json({ success: true, count: tags.length, tags });
});

export const updateTag = asyncHandler(async (req, res) => {
  const name = normalizeTagName(req.body.name);

  const tag = await Tag.findOne({ _id: req.params.id, ownerId: req.user.id });
  if (!tag) {
    throw new AppError('Tag not found', 404);
  }

  const oldName = tag.name;
  if (oldName === name) {
    return res.json({ success: true, tag });
  }

  const duplicate = await Tag.findOne({ ownerId: req.user.id, name });
  if (duplicate) {
    throw new AppError('Tag already exists', 400);
  }

  tag.name = name;
  await tag.save();

  // Keep tasks consistent by replacing old tag text with new one.
  const tasks = await Task.find({ ownerId: req.user.id, tags: oldName });
  for (const task of tasks) {
    const mapped = task.tags.map((t) => (t === oldName ? name : t));
    task.tags = [...new Set(mapped)];
    await task.save();
  }

  res.json({ success: true, tag });
});

export const deleteTag = asyncHandler(async (req, res) => {
  const tag = await Tag.findOne({ _id: req.params.id, ownerId: req.user.id });
  if (!tag) {
    throw new AppError('Tag not found', 404);
  }

  await Task.updateMany(
    { ownerId: req.user.id, tags: tag.name },
    { $pull: { tags: tag.name } }
  );

  await tag.deleteOne();

  res.json({ success: true, message: 'Tag deleted successfully' });
});
