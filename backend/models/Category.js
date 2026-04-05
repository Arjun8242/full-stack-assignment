import mongoose from 'mongoose';

/**
 * Pre-defined system categories available to every user.
 * ownerId is null for these; user-created categories carry the numeric ownerId.
 */
export const DEFAULT_CATEGORIES = ['Work', 'Personal', 'Urgent'];

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    /** null = system/default category; numeric = user-created */
    ownerId: {
      type: Number,
      default: null,
      index: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      }
    }
  }
);

// A user cannot have two categories with the same name,
// and system defaults are also unique within the null-ownerId namespace.
categorySchema.index({ name: 1, ownerId: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);

export default Category;
