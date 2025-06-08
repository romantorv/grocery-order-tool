import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  displayName: string;
  role: 'member' | 'admin';
  sessionId: string;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  displayName: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  role: {
    type: String,
    required: true,
    enum: ['member', 'admin'],
    default: 'member'
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Additional composite index for efficient lookups
UserSchema.index({ displayName: 1, role: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);