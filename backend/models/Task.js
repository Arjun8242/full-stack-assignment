import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    ownerId: {
      type: Number,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000
    },
    dueDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending'
    },
    category: {
      type: String,
      default: null,
      trim: true
    },
    tags: {
      type: [String],
      default: []
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

const Task = mongoose.model('Task', taskSchema);

export default Task;
