import mongoose from 'mongoose';
import { dbState } from '../config/db.js';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // optional if guest or fallback
    },
    userEmail: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['Credit / Debit Card', 'UPI / Net Banking', 'Cash on Delivery'],
      default: 'Credit / Debit Card',
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    discount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      enum: ['Processing', 'Confirmed', 'Shipped', 'Delivered'],
      default: 'Confirmed',
    },
  },
  {
    timestamps: true,
  }
);

export const OrderModel = mongoose.models.Order || mongoose.model('Order', orderSchema);

export const memoryOrders = dbState.collections.orders;

/**
 * Unified Order Repository
 */
export const OrderRepository = {
  async create(orderData) {
    if (dbState.isConnectedToAtlas) {
      try {
        const order = new OrderModel(orderData);
        return await order.save();
      } catch (err) {
        console.log('[OrderRepository] Atlas create error, using fallback:', err.message);
      }
    }

    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const newOrder = {
      _id: orderId,
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryOrders.unshift(newOrder);
    return newOrder;
  },

  async findByUserId(userId, userEmail) {
    if (dbState.isConnectedToAtlas) {
      try {
        return await OrderModel.find({
          $or: [{ user: userId }, { userEmail: userEmail?.toLowerCase() }],
        }).sort({ createdAt: -1 });
      } catch (err) {
        console.log('[OrderRepository] Atlas findByUserId error, using fallback:', err.message);
      }
    }

    return memoryOrders.filter(
      (o) =>
        (userId && String(o.user) === String(userId)) ||
        (userEmail && o.userEmail?.toLowerCase() === userEmail.toLowerCase())
    );
  },

  async findById(id) {
    if (dbState.isConnectedToAtlas) {
      try {
        return await OrderModel.findById(id);
      } catch (err) {
        console.log('[OrderRepository] Atlas findById error, using fallback:', err.message);
      }
    }
    return memoryOrders.find((o) => String(o._id) === String(id)) || null;
  },

  async count() {
    if (dbState.isConnectedToAtlas) {
      try {
        return await OrderModel.countDocuments();
      } catch (err) {
        console.log('[OrderRepository] Atlas count error, using fallback:', err.message);
      }
    }
    return memoryOrders.length;
  },
};
