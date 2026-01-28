import mongoose from 'mongoose';

/**
 * Single-document store for site-wide frontend configuration.
 * Key "site" holds the full config (hero, features, header, footer, etc.).
 */
const SiteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'site' },
    value: { type: mongoose.Schema.Types.Mixed, required: true, default: () => ({}) }
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.models.SiteSettings || mongoose.model('SiteSettings', SiteSettingsSchema);
