// Want List related types

import { ProductWithDetails } from './product';

export interface WantListItem {
  id: string;
  wantListId: string;
  productId: string;
  addedAt: string;
  product: ProductWithDetails;
}

export interface WantList {
  id: string | null;
  buyerId: string;
  status: 'active' | 'completed' | 'cancelled';
  items: WantListItem[];
  totalPrice: number;
  itemCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BuyerInfo {
  id: string;
  name: string;
  telephone: string;
  address: string;
}

export interface WantListWithBuyer extends WantList {
  buyer: BuyerInfo;
}

export interface AddToWantListData {
  product_id: string;
}