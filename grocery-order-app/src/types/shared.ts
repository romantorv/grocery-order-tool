export interface User {
  displayName: string;
  role: string;
  sessionId: string;
}

export interface GroceryItem {
  _id: string;
  productName: string;
  productUrl: string;
  quantity: number;
  price?: number;
  status: 'pending' | 'ordered' | 'completed' | 'failed';
  notes?: string;
  errorMessage?: string;
  createdAt: string;
  userId: {
    _id: string;
    displayName: string;
  };
  batchId?: {
    _id: string;
    batchName: string;
    completionDate: string;
  };
}

export interface OrderBatch {
  _id: string;
  batchName: string;
  completionDate: string;
  itemCount: number;
  totalValue: number;
  notes?: string;
  createdAt: string;
}

export type TabType = 'pending' | 'ordered' | 'completed' | 'batches';

export interface TabCount {
  pending: number;
  ordered: number;
  completed: number;
}