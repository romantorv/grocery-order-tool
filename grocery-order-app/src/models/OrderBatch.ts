import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderBatch extends Document {
  batchName: string;
  completionDate: Date;
  itemCount: number;
  totalValue: number;
  createdBy: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderBatchSchema = new Schema<IOrderBatch>({
  batchName: {
    type: String,
    required: true,
    trim: true
  },
  completionDate: {
    type: Date,
    required: true
  },
  itemCount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalValue: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  createdBy: {
    type: String,
    required: true,
    default: 'system'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
OrderBatchSchema.index({ completionDate: -1 });
OrderBatchSchema.index({ itemCount: 1 });

export default mongoose.models.OrderBatch || mongoose.model<IOrderBatch>('OrderBatch', OrderBatchSchema);