export interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    sizePrices?: Record<string, number>;
    stock: number;
    images: string[];
    sizes?: string[];
    colors?: string[];
    category:{
        _id: string;
         name: string;
        description: string;
    }
    seller?: {
      _id: string;
      name: string;
      email: string;
      role: string;
    }
    createdAt?: Date;
    updatedAt?: Date;
    }
