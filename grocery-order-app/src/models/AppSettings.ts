import mongoose, { Schema, Document } from 'mongoose';

export interface IAppSettings extends Document {
  key: string;
  value: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppSettingsSchema = new Schema<IAppSettings>({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  value: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Note: Key field already has unique index from schema definition

export default mongoose.models.AppSettings || mongoose.model<IAppSettings>('AppSettings', AppSettingsSchema);