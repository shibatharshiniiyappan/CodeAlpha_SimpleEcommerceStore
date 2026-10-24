import express from 'express';
import { ProductRepository } from '../models/Product.js';

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Fetch all products with optional filters, search, and sorting
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const products = await ProductRepository.getAll({ category, search, sort });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('[Product List Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve products.',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/products/categories
 * @desc    Get list of unique categories
 * @access  Public
 */
router.get('/categories', async (req, res) => {
  try {
    const products = await ProductRepository.getAll({});
    const categories = ['All', ...new Set(products.map((p) => p.category))];
    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Fetch single product by ID or slug
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await ProductRepository.getById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }
    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching product details.',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/products/seed
 * @desc    Seed initial catalog data
 * @access  Public
 */
router.post('/seed', async (req, res) => {
  try {
    const result = await ProductRepository.seedAtlas();
    return res.status(200).json({
      success: true,
      message: 'Product catalog verified/seeded successfully.',
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to seed products.',
      error: error.message,
    });
  }
});

export default router;
