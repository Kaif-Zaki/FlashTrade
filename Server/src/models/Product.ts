import mongoose from "mongoose";

type Product  = {
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  sizes?: string[];
  colors?: string[];
  category: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};


 const productSchema = new mongoose.Schema<Product>({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    minlength: [2, "Product name must be at least 2 characters"],
  },
  description: {
    type: String,
    required: [true, "product description is required"],
    trim: true,
    minlength: [2, "product description must be at least 2 characters"],
  },
  
  price: {
    type: Number,
    required: [true, "Book price is required"],
    min: [0, "Book price must be at least 0"],
  },
  stock: {
    type: Number,
    required: [true, "Book stock is required"],
    min: [0, "Book stock must be at least 0"],
  },
  images: {
    type: [String],
    required: [true, "At least one image URL is required"],
      message: "At least one image URL is required",
    },
    colors: {
      type: [String],
      default: []
    },

    sizes: {
      type: [String],
      default: []
    },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "Book category is required"],
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Product seller is required"],
    index: true,
  },


}, { timestamps: true });

export  const ProductModel = mongoose.model("Product", productSchema);
