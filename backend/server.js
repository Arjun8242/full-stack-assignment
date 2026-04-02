import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import { errorHandler, notFound } from './utils/errorHandler.js';
import { connectPostgres, closePostgres } from './db/postgres.js';
import { initializeUsersTable } from './repositories/userRepository.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

const startServer = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is required');
    }

    await Promise.all([
      mongoose.connect(process.env.MONGODB_URI),
      connectPostgres()
    ]);
    await initializeUsersTable();

    console.log('MongoDB connected');
    console.log('PostgreSQL connected');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  Promise.allSettled([mongoose.connection.close(), closePostgres()])
    .finally(() => process.exit(0));
});

startServer();

