import jwt from 'jsonwebtoken';
import { UserRepository } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'codealpha-ecommerce-secret-key-2026';

export async function protect(req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      const user = await UserRepository.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('[Auth Middleware] Token error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token. Please sign in again.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in to access this feature.',
    });
  }
}

export function generateToken(id) {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '7d',
  });
}
