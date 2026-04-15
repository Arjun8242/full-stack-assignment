import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    ownerId: {
      type: Number,
      required: true,
      index: true
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

// A user cannot have duplicate tag names.
tagSchema.index({ name: 1, ownerId: 1 }, { unique: true });

const Tag = mongoose.model('Tag', tagSchema);

export default Tag;
