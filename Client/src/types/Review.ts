export interface Review {
  _id: string;
  name: string;
  email: string;
  rating: number;
  review: string;
  productId?: string;
  createdAt: string;
}

export interface CreateReviewPayload {
  name: string;
  email: string;
  rating: number;
  review: string;
  productId?: string;
}
