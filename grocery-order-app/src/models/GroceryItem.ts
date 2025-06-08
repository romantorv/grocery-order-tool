import mongoose, { Schema, Document } from 'mongoose';

export interface IGroceryItem extends Document {
  userId: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId;
  productName: string;
  productUrl: string;
  quantity: number;
  price?: number;
  status: 'pending' | 'ordered' | 'completed' | 'failed';
  notes?: string;
  errorMessage?: string;
  orderedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GroceryItemSchema = new Schema<IGroceryItem>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  batchId: {
    type: Schema.Types.ObjectId,
    ref: 'OrderBatch'
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  productUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Invalid URL format'
    }
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'ordered', 'completed', 'failed'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  errorMessage: {
    type: String,
    trim: true
  },
  orderedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
GroceryItemSchema.index({ userId: 1, status: 1 });
GroceryItemSchema.index({ status: 1, completedAt: 1 });
GroceryItemSchema.index({ batchId: 1 });

export default mongoose.models.GroceryItem || mongoose.model<IGroceryItem>('GroceryItem', GroceryItemSchema);