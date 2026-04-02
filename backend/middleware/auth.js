import jwt from 'jsonwebtoken';
import { AppError } from '../utils/appError.js';

const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return req.cookies.token;
};

export const authMiddleware = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next(new AppError('Not authenticated', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      return next(new AppError('Invalid token payload', 401));
    }

    req.user = {
      id: Number(decoded.id),
      email: decoded.email,
      name: decoded.name ?? null
    };

    next();
  } catch (error) {
    return next(new AppError('Invalid token', 401));
  }
};
