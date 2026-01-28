import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    images: { type: [String], default: [] },
    category: { type: String, default: 'Others' },
    community: { type: String, default: 'global', index: true },
    vendor: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    likes: { type: Number, default: 0 }
  },
  { 
    timestamps: true, 
    versionKey: false,
    // Add compound unique index to prevent duplicates
    index: { name: 1, vendor: 1, community: 1 }, 
    unique: true
  }
);

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
