import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    sellerId: { type: String, default: '', index: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true
    },
    items: { type: [OrderItemSchema], default: [] }
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
