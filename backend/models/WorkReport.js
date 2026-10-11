import mongoose from 'mongoose';

const workReportSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true
    },
    completedWork: {
      type: String,
      required: [true, 'Work completed today is required'],
      trim: true
    },
    tasksWorkedOn: {
      type: [String],
      default: []
    },
    blockers: {
      type: String,
      default: '',
      trim: true
    },
    tomorrowPlan: {
      type: String,
      default: '',
      trim: true
    },
    remarks: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

workReportSchema.index({ employee: 1, date: 1 });

export default mongoose.models.WorkReport || mongoose.model('WorkReport', workReportSchema);
