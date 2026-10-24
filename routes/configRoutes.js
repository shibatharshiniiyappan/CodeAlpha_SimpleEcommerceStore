import express from 'express';
import mongoose from 'mongoose';
import { dbState } from '../config/db.js';
import { UserRepository } from '../models/User.js';
import { ProductRepository } from '../models/Product.js';
import { OrderRepository } from '../models/Order.js';

const router = express.Router();

/**
 * @route   GET /api/config/status
 * @desc    Get database connection state and document statistics
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    const userCount = await UserRepository.count();
    const productCount = (await ProductRepository.getAll({})).length;
    const orderCount = await OrderRepository.count();

    return res.status(200).json({
      success: true,
      database: {
        isConnectedToAtlas: dbState.isConnectedToAtlas,
        mode: dbState.isConnectedToAtlas ? 'MongoDB Atlas (Live Cluster)' : 'High-Fidelity Persistence (Zero-downtime)',
        host: dbState.atlasHost || (process.env.MONGODB_URI ? 'Configured in .env' : 'Local Memory Engine'),
        databaseName: dbState.databaseName || 'ecommerce',
        hasEnvUri: Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim().length > 0),
        ipWhitelistRequired: Boolean(dbState.ipWhitelistRequired),
        whitelistInstructions: 'Add IP address 0.0.0.0/0 under MongoDB Atlas > Security > Network Access to permit cloud connections.',
        lastError: dbState.connectionError,
        counts: {
          users: userCount,
          products: productCount,
          orders: orderCount,
        },
      },
      internshipInfo: {
        organization: 'CodeAlpha',
        project: 'Simple E-Commerce Store',
        stack: {
          frontend: 'Plain HTML5, CSS3, Vanilla JavaScript (Zero Frameworks)',
          backend: 'Node.js + Express.js',
          database: 'MongoDB Atlas with Mongoose ODM',
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve database status.',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/config/connect
 * @desc    Connect to a live MongoDB Atlas URI
 * @access  Public
 */
router.post('/connect', async (req, res) => {
  const { uri } = req.body;
  if (!uri || !uri.startsWith('mongodb')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid MongoDB connection URI format.',
    });
  }

  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    dbState.isConnectedToAtlas = true;
    dbState.atlasHost = conn.connection.host;
    dbState.databaseName = conn.connection.name;
    dbState.mode = 'atlas';
    dbState.connectionError = null;

    // Auto-seed products if empty
    await ProductRepository.seedAtlas();

    return res.status(200).json({
      success: true,
      message: `Successfully connected to MongoDB Atlas: ${conn.connection.host}`,
      host: conn.connection.host,
    });
  } catch (err) {
    dbState.isConnectedToAtlas = false;
    dbState.connectionError = err.message;
    return res.status(400).json({
      success: false,
      message: `Failed to connect to MongoDB Atlas: ${err.message}`,
    });
  }
});

export default router;
