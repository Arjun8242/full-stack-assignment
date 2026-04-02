import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail, findUserById } from '../repositories/userRepository.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const buildToken = (user) => jwt.sign(
  { id: user.id, email: user.email, name: user.name ?? null },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/'
  });
};

export const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new AppError('Email already exists', 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const createdUser = await createUser({
    name: name?.trim() || null,
    email: normalizedEmail,
    passwordHash
  });

  const token = buildToken(createdUser);
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = buildToken(user);
  setAuthCookie(res, token);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
});

export const logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

export const profile = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
});
