import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    department: {
      type: String,
      default: 'Engineering'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    startDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    },
    deadline: {
      type: String,
      required: [true, 'Deadline date is required']
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
      default: 'Not Started',
      index: true
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    remarks: {
      type: String,
      default: ''
    },
    completedAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

taskSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.models.Task || mongoose.model('Task', taskSchema);
