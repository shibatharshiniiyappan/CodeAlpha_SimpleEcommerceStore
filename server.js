import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import { ProductRepository } from './models/Product.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import configRoutes from './routes/configRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security and utility middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.use('/src/assets/images', express.static(path.join(__dirname, 'src', 'assets', 'images')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/config', configRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'LUMEN Studio E-Commerce API',
  });
});

// Single Page Frontend Fallback
app.get('*', (req, res, next) => {
  // If it's an API route that didn't match, return 404 JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint ${req.originalUrl} not found.`,
    });
  }
  // Otherwise serve public/index.html
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start database connection and launch server
async function startServer() {
  await connectDB();
  await ProductRepository.seedAtlas();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` LUMEN Studio E-Commerce Store (CodeAlpha Internship)`);
    console.log(` Server running on http://0.0.0.0:${PORT}`);
    console.log(` Stack: Vanilla HTML5/CSS/JS + Express + MongoDB Atlas`);
    console.log(`=======================================================`);
  });
}

// Only start the listener if run directly (not as a Vercel serverless function module)
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
