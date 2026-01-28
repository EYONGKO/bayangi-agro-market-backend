import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    excerpt: { type: String, default: '' },
    category: { type: String, default: 'Platform Updates', index: true },
    image: { type: String, default: '' },
    author: { type: String, default: 'Local Roots' },
    date: { type: String, default: '' },
    tags: { type: [String], default: [] },
    content: { type: [String], default: [] }
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.models.Post || mongoose.model('Post', PostSchema);
