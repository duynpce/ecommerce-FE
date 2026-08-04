export type ProductCategory =
  | 'ELECTRONICS'
  | 'CLOTHING'
  | 'BOOKS'
  | 'HOME_AND_KITCHEN'
  | 'BEAUTY_AND_HEALTH'
  | 'MEDICALS'
  | 'ELSE';

export interface ProductResponse {
  id: string;
  contributorId: string;
  shopId: string;
  imgUrls: string[];
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category: ProductCategory;
  attributes: Record<string, string>;
}

export interface CreateProductRequest {
  shopId: string;
  imgs: File[];
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category: ProductCategory;
  attributes?: Record<string, string>;
}

export interface UpdateProductRequest {
  id: string;
  imgs?: File[];
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  category?: ProductCategory;
  attributes?: Record<string, string>;
}

export interface ProductFilter {
  name?: string;
  category?: ProductCategory;
  contributorId?: string;
  shopId?: string;
  minPrice?: number;
  maxPrice?: number;
  createdFrom?: string;
  createdTo?: string;
  page: number;
  limit: number;
}
