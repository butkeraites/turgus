// Want List related types

import { ProductWithDetails } from './product';

export interface WantListItem {
  id: string;
  want_list_id: string;
  product_id: string;
  added_at: string;
  product: ProductWithDetails;
}

export interface WantList {
  id: string | null;
  buyer_id: string;
  status: 'active' | 'completed' | 'cancelled';
  items: WantListItem[];
  total_price: number;
  item_count: number;
  created_at: string | null;
  updated_at: string | null;
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