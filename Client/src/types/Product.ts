export interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    images: string[];
    sizes?: string[];
    colors?: string[];
    category:{
        _id: string;
         name: string;
        description: string;
    }
    createdAt?: Date;
    updatedAt?: Date;
    }