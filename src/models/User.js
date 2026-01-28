import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['buyer', 'seller', 'both'], default: 'buyer' },
    verifiedSeller: { type: Boolean, default: false },
    // Artisan-specific fields
    avatar: { type: String, default: '' }, // Base64 image or URL
    phone: { type: String, default: '' },
    community: { type: String, default: '' },
    specialty: { type: String, default: '' },
    bio: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
