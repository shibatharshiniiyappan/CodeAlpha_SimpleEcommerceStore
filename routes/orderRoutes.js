import express from 'express';
import { OrderRepository } from '../models/Order.js';
import { ProductRepository } from '../models/Product.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/orders
 * @desc    Create a new order (Checkout processing)
 * @access  Private (Authenticated)
 */
router.post('/', protect, async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      couponCode,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in order payload.',
      });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all required shipping address fields.',
      });
    }

    // Calculate prices server-side to prevent tampering
    let itemsPrice = 0;
    for (const item of orderItems) {
      const product = await ProductRepository.getById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.title}" is no longer available.`,
        });
      }
      if (product.countInStock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.title}". Only ${product.countInStock} available.`,
        });
      }
      itemsPrice += product.price * item.qty;
    }

    // Promo code calculation (e.g. CODEALPHA10 for 10% off)
    let discount = 0;
    if (couponCode && couponCode.trim().toUpperCase() === 'CODEALPHA10') {
      discount = Number((itemsPrice * 0.10).toFixed(2));
    }

    // Shipping rules: Free shipping over $150, else $15 flat
    const shippingPrice = itemsPrice >= 150 ? 0 : 15;
    const taxPrice = Number(((itemsPrice - discount) * 0.08).toFixed(2));
    const totalPrice = Number((itemsPrice - discount + shippingPrice + taxPrice).toFixed(2));

    // Deduct inventory stock
    for (const item of orderItems) {
      await ProductRepository.updateStock(item.product, item.qty);
    }

    const orderData = {
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'Credit / Debit Card',
      itemsPrice,
      shippingPrice,
      taxPrice,
      discount,
      totalPrice,
      isPaid: paymentMethod !== 'Cash on Delivery',
      paidAt: paymentMethod !== 'Cash on Delivery' ? new Date() : null,
      status: 'Confirmed',
    };

    const createdOrder = await OrderRepository.create(orderData);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully! Thank you for your purchase.',
      order: createdOrder,
    });
  } catch (error) {
    console.error('[Create Order Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process order.',
    });
  }
});

/**
 * @route   GET /api/orders/my-orders
 * @desc    Get order history for authenticated user
 * @access  Private
 */
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await OrderRepository.findByUserId(req.user._id, req.user.email);
    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve order history.',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await OrderRepository.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Verify ownership or admin
    if (String(order.user) !== String(req.user._id) && order.userEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order.',
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve order.',
      error: error.message,
    });
  }
});

export default router;
