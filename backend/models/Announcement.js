import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Announcement message is required'],
      trim: true
    },
    audience: {
      type: String,
      enum: ['All Employees', 'Department', 'Specific Employee'],
      default: 'All Employees'
    },
    department: {
      type: String,
      default: ''
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
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

export default mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
