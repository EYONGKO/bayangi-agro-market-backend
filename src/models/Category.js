import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true }
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
