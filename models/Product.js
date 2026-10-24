import mongoose from 'mongoose';
import { dbState } from '../config/db.js';

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a product title'],
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price must be positive'],
    },
    compareAtPrice: {
      type: Number,
      default: null,
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Please provide an image URL'],
    },
    additionalImages: [String],
    rating: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 14,
    },
    countInStock: {
      type: Number,
      required: true,
      default: 15,
      min: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    specs: [
      {
        key: String,
        value: String,
      },
    ],
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Compile Mongoose model
export const ProductModel = mongoose.models.Product || mongoose.model('Product', productSchema);

// Seed Catalog Data
export const initialProducts = [
  {
    _id: 'prd_01_ceramic_vase',
    title: 'Aura Fluted Ceramic Vase',
    slug: 'aura-fluted-ceramic-vase',
    description:
      'Handcrafted from porous natural stoneware with organic vertical fluting. Fired at high temperature with a tactile matte finish that catches soft ambient light. Ideal as a sculptural centerpiece or styled with dry botanicals.',
    price: 89,
    compareAtPrice: 110,
    category: 'Decor',
    image: '/images/vase.jpg',
    additionalImages: ['/images/vase.jpg', '/images/hero.jpg'],
    rating: 4.9,
    numReviews: 38,
    countInStock: 24,
    featured: true,
    specs: [
      { key: 'Material', value: 'High-fire ceramic stoneware' },
      { key: 'Dimensions', value: '11.5" H × 6.8" W' },
      { key: 'Finish', value: 'Matte chalk travertine' },
      { key: 'Origin', value: 'Hand-thrown in Portugal' },
    ],
    tags: ['Artisanal', 'Minimalist', 'Bestseller'],
  },
  {
    _id: 'prd_02_audio_headphones',
    title: 'Lumen Studio Wireless Headphones',
    slug: 'lumen-studio-wireless-headphones',
    description:
      'Engineered with 45mm custom dynamic drivers for audiophile-grade acoustic transparency and deep, articulate bass. Features aerospace aluminum pivots, soft protein-leather earcups, and up to 40 hours of playback.',
    price: 249,
    compareAtPrice: 289,
    category: 'Audio',
    image: '/images/headphones.jpg',
    additionalImages: ['/images/headphones.jpg'],
    rating: 4.8,
    numReviews: 64,
    countInStock: 18,
    featured: true,
    specs: [
      { key: 'Driver', value: '45mm Neodymium Dual-Acoustic' },
      { key: 'Battery', value: '40 Hours Playtime (Fast USB-C)' },
      { key: 'Weight', value: '265g lightweight build' },
      { key: 'Connectivity', value: 'Bluetooth 5.3 + 3.5mm lossless' },
    ],
    tags: ['Hi-Fi', 'Noise Isolating', 'Wireless'],
  },
  {
    _id: 'prd_03_linen_throw',
    title: 'Waffle-Knit Organic Linen Throw',
    slug: 'waffle-knit-organic-linen-throw',
    description:
      'Woven from 100% GOTS certified European flax linen with a breathable deep waffle texture. Pre-washed with natural pumice stones for an extraordinarily soft, lived-in drape that softens with every wash.',
    price: 115,
    compareAtPrice: 135,
    category: 'Textiles',
    image: '/images/throw.jpg',
    additionalImages: ['/images/throw.jpg'],
    rating: 4.9,
    numReviews: 42,
    countInStock: 30,
    featured: true,
    specs: [
      { key: 'Material', value: '100% Organic European Flax' },
      { key: 'Size', value: '55" × 78" (140cm × 200cm)' },
      { key: 'Care', value: 'Machine wash gentle, tumble dry low' },
      { key: 'Certification', value: 'OEKO-TEX® Standard 100' },
    ],
    tags: ['Eco-Friendly', 'Linen', 'Seasonal'],
  },
  {
    _id: 'prd_04_amber_candle',
    title: 'Botanist Amber & Oakmoss Candle',
    slug: 'botanist-amber-oakmoss-candle',
    description:
      'Poured in small batches using 100% clean-burning soy wax and braided unbleached cotton wicks. Infused with pure essential oils of golden amber, earthy oakmoss, crushed cedar needles, and warm Madagascar vanilla.',
    price: 38,
    compareAtPrice: 45,
    category: 'Wellness',
    image: '/images/candle.jpg',
    additionalImages: ['/images/candle.jpg'],
    rating: 5.0,
    numReviews: 89,
    countInStock: 50,
    featured: true,
    specs: [
      { key: 'Volume', value: '8 oz / 226g net weight' },
      { key: 'Burn Time', value: '50-55 continuous hours' },
      { key: 'Wax', value: '100% American Soy Wax' },
      { key: 'Vessel', value: 'Reusable apothecary amber jar' },
    ],
    tags: ['Aromatherapy', 'Soy Wax', 'Cruelty Free'],
  },
  {
    _id: 'prd_05_lounge_chair',
    title: 'Architectural Cognac Leather Lounge',
    slug: 'architectural-cognac-leather-lounge',
    description:
      'An iconic silhouette combining cold-rolled matte black steel cantilever framing with top-grain Italian cognac leather upholstery. Ergonomically angled for long reading sessions and quiet afternoon repose.',
    price: 780,
    compareAtPrice: 920,
    category: 'Living',
    image: '/images/hero.jpg',
    additionalImages: ['/images/hero.jpg'],
    rating: 4.9,
    numReviews: 21,
    countInStock: 7,
    featured: true,
    specs: [
      { key: 'Frame', value: 'Laser-cut tubular steel, matte black' },
      { key: 'Leather', value: 'Full-aniline top-grain Italian leather' },
      { key: 'Dimensions', value: '32" W × 34" D × 31" H' },
      { key: 'Weight Capacity', value: '350 lbs' },
    ],
    tags: ['Furniture', 'Statement Piece', 'Handmade'],
  },
];

// Initialize in-memory collection
dbState.collections.products = [...initialProducts];

/**
 * Unified Product Repository
 */
export const ProductRepository = {
  async getAll({ category, search, sort }) {
    if (dbState.isConnectedToAtlas) {
      try {
        let query = {};
        if (category && category !== 'All') {
          query.category = { $regex: new RegExp(`^${category}$`, 'i') };
        }
        if (search) {
          query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } },
          ];
        }

        let queryExec = ProductModel.find(query);
        if (sort === 'price-low') queryExec = queryExec.sort({ price: 1 });
        else if (sort === 'price-high') queryExec = queryExec.sort({ price: -1 });
        else if (sort === 'rating') queryExec = queryExec.sort({ rating: -1 });
        else if (sort === 'newest') queryExec = queryExec.sort({ createdAt: -1 });
        else queryExec = queryExec.sort({ featured: -1, createdAt: -1 });

        return await queryExec.exec();
      } catch (err) {
        console.log('[ProductRepository] Atlas query notice, using fallback items:', err.message);
      }
    }

    // In-memory filter/sort
    let items = [...dbState.collections.products];
    if (category && category !== 'All') {
      items = items.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    if (sort === 'price-low') {
      items.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      items.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      items.sort((a, b) => b.rating - a.rating);
    }

    return items;
  },

  async getById(id) {
    if (dbState.isConnectedToAtlas) {
      try {
        const product = await ProductModel.findById(id);
        if (product) return product;
        return await ProductModel.findOne({ slug: id });
      } catch (err) {
        console.log('[ProductRepository] Atlas getById error, using fallback:', err.message);
      }
    }
    return (
      dbState.collections.products.find((p) => String(p._id) === String(id) || p.slug === id) ||
      null
    );
  },

  async seedAtlas() {
    if (!dbState.isConnectedToAtlas) return { seeded: false, count: dbState.collections.products.length };
    try {
      const count = await ProductModel.countDocuments();
      if (count === 0) {
        await ProductModel.insertMany(initialProducts.map(({ _id, ...p }) => p));
        console.log(`[Database] Seeded ${initialProducts.length} products to MongoDB Atlas.`);
        return { seeded: true, count: initialProducts.length };
      }
      return { seeded: false, count };
    } catch (err) {
      console.log('[ProductRepository] Atlas seed notice, deferring to fallback:', err.message);
      dbState.isConnectedToAtlas = false;
      return { seeded: false, count: dbState.collections.products.length };
    }
  },

  async updateStock(id, qtyPurchased) {
    if (dbState.isConnectedToAtlas) {
      try {
        const prd = await ProductModel.findById(id);
        if (prd) {
          prd.countInStock = Math.max(0, prd.countInStock - qtyPurchased);
          await prd.save();
        }
        return;
      } catch (err) {
        console.log('[ProductRepository] Atlas updateStock notice, using fallback:', err.message);
      }
    }
    const prd = dbState.collections.products.find((p) => String(p._id) === String(id));
    if (prd) {
      prd.countInStock = Math.max(0, prd.countInStock - qtyPurchased);
    }
  },
};
