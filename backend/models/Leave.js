import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    leaveType: {
      type: String,
      enum: ['Casual Leave', 'Sick Leave', 'Personal Leave', 'Other'],
      required: [true, 'Leave type is required']
    },
    fromDate: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'From date is required']
    },
    toDate: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'To date is required']
    },
    reason: {
      type: String,
      required: [true, 'Reason for leave is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true
    },
    adminRemarks: {
      type: String,
      default: ''
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

leaveSchema.index({ employee: 1, status: 1 });

export default mongoose.models.Leave || mongoose.model('Leave', leaveSchema);
