import mongoose from 'mongoose';

const VisitSchema = new mongoose.Schema(
  {
    path: { type: String, required: true, default: '/' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false }
);

VisitSchema.index({ createdAt: -1 });

export default mongoose.models.Visit || mongoose.model('Visit', VisitSchema);
