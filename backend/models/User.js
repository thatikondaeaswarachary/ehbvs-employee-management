import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['ADMIN', 'EMPLOYEE', 'MANAGER'],
      default: 'EMPLOYEE'
    },
    department: {
      type: String,
      trim: true,
      default: 'Engineering'
    },
    designation: {
      type: String,
      trim: true,
      default: 'Software Engineer'
    },
    joiningDate: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    workStatus: {
      type: String,
      enum: ['Offline', 'Working', 'Break', 'Completed'],
      default: 'Offline'
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    avatar: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.User || mongoose.model('User', userSchema);
