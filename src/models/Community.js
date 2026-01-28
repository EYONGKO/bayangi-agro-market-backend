import mongoose from 'mongoose';

const CommunitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' }
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.models.Community || mongoose.model('Community', CommunitySchema);
