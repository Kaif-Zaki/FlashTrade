export interface Offer {
  _id: string;
  title: string;
  description?: string;
  discountPercent: number;
  validTill: string;
}
