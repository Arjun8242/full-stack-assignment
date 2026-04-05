import Category, { DEFAULT_CATEGORIES } from '../models/Category.js';
import Task from '../models/Task.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ─── Seed Default Categories ─────────────────────────────────────────────────

/**
 * Insert the system-level default categories if they don't exist yet.
 * Call once on server startup.
 */
export const seedDefaultCategories = async () => {
  for (const name of DEFAULT_CATEGORIES) {
    await Category.updateOne(
      { name, ownerId: null },
      { $setOnInsert: { name, ownerId: null, isDefault: true } },
      { upsert: true }
    );
  }
  console.log('[CATEGORY] Default categories seeded.');
};

// ─── Handlers ────────────────────────────────────────────────────────────────

/**
 * POST /categories
 * Create a custom category for the authenticated user.
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  // Prevent clash with system defaults (case-insensitive)
  const existingDefault = await Category.findOne({
    name: { $regex: new RegExp(`^${name}$`, 'i') },
    ownerId: null
  });
  if (existingDefault) {
    throw new AppError(`"${name}" is a system default category and cannot be recreated`, 400);
  }

  const category = await Category.create({
    name,
    ownerId: req.user.id,
    isDefault: false
  });

  res.status(201).json({ success: true, category });
});

/**
 * GET /categories
 * Return system defaults + the authenticated user's custom categories.
 */
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({
    $or: [{ ownerId: null }, { ownerId: req.user.id }]
  }).sort({ isDefault: -1, name: 1 });

  res.json({ success: true, categories });
});

/**
 * PATCH /categories/:id
 * Rename an existing user-created category (not defaults).
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const category = await Category.findOne({
    _id: req.params.id,
    ownerId: req.user.id
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  if (category.isDefault) {
    throw new AppError('System default categories cannot be modified', 403);
  }

  const oldName = category.name;
  category.name = name;
  await category.save();

  // Keep existing tasks consistent — update their category field
  if (oldName !== name) {
    await Task.updateMany(
      { ownerId: req.user.id, category: oldName },
      { $set: { category: name } }
    );
  }

  res.json({ success: true, category });
});

/**
 * DELETE /categories/:id
 * Delete a user-created category. Tasks using it will have category set to null.
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({
    _id: req.params.id,
    ownerId: req.user.id
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  if (category.isDefault) {
    throw new AppError('System default categories cannot be deleted', 403);
  }

  // Nullify category on tasks that used this category
  await Task.updateMany(
    { ownerId: req.user.id, category: category.name },
    { $set: { category: null } }
  );

  await category.deleteOne();

  res.json({ success: true, message: 'Category deleted successfully' });
});
