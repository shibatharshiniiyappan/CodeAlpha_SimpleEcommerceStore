import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { dbState } from '../config/db.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving in Mongoose (Mongoose v8 async hook)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Compile Mongoose Model
export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

// In-Memory store for development / offline / test mode
export const memoryUsers = dbState.collections.users;

/**
 * Unified User Repository (Supports both Mongoose/Atlas and In-Memory fallback)
 */
export const UserRepository = {
  async findByEmail(email) {
    if (dbState.isConnectedToAtlas) {
      try {
        return await UserModel.findOne({ email: email.toLowerCase().trim() });
      } catch (err) {
        console.log('[UserRepository] Atlas findByEmail error, using fallback:', err.message);
      }
    }
    return memoryUsers.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  },

  async findById(id) {
    if (dbState.isConnectedToAtlas) {
      try {
        return await UserModel.findById(id).select('-password');
      } catch (err) {
        console.log('[UserRepository] Atlas findById error, using fallback:', err.message);
      }
    }
    const user = memoryUsers.find((u) => u._id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  },

  async create({ name, email, password, role = 'customer' }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (dbState.isConnectedToAtlas) {
      try {
        const user = new UserModel({
          name,
          email: email.toLowerCase().trim(),
          password,
          role,
        });
        return await user.save();
      } catch (err) {
        console.log('[UserRepository] Atlas create error, using fallback:', err.message);
      }
    }

    const newUser = {
      _id: 'usr_' + Date.now() + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString(),
      async matchPassword(entered) {
        return await bcrypt.compare(entered, this.password);
      },
    };
    memoryUsers.push(newUser);
    return newUser;
  },

  async count() {
    if (dbState.isConnectedToAtlas) {
      try {
        return await UserModel.countDocuments();
      } catch (err) {
        console.log('[UserRepository] Atlas count error, using fallback:', err.message);
      }
    }
    return memoryUsers.length;
  },
};
