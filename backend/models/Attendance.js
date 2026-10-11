import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
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
    checkIn: {
      type: Date,
      default: null
    },
    checkOut: {
      type: Date,
      default: null
    },
    workingMinutes: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Half Day', 'Leave', 'Holiday'],
      default: 'Present'
    },
    workStatus: {
      type: String,
      enum: ['Offline', 'Working', 'Break', 'Completed'],
      default: 'Working'
    },
    remarks: {
      type: String,
      default: ''
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate check-in per employee per calendar date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
