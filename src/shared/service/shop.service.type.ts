export type ShopStatus = 'INACTIVE' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

export interface AddressResponse {
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  country?: string;
  zipCode?: string;
}

export interface ShopResponse {
  id: string;
  contributorId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  pickUpAddress?: AddressResponse;
  rating?: number;
  soldQuantity?: number;
  oneStarRatingCount?: number;
  twoStarRatingCount?: number;
  threeStarRatingCount?: number;
  fourStarRatingCount?: number;
  fiveStarRatingCount?: number;
  status: ShopStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShopRequest {
  logo?: File;
  name: string;
  description?: string;
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  country?: string;
  zipCode?: string;
}

export interface UpdateShopRequest {
  logo?: File;
  name?: string;
  description?: string;
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  country?: string;
  zipCode?: string;
  status?: ShopStatus;
}

export interface ShopFilter {
  name?: string;
  contributorId?: string;
  status?: ShopStatus;
  page?: number;
  limit?: number;
}
