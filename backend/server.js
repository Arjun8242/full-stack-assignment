import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import categoryRoutes from './routes/categories.js';
import { errorHandler, notFound } from './utils/errorHandler.js';
import { connectPostgres, closePostgres } from './db/postgres.js';
import { initializeUsersTable } from './repositories/userRepository.js';
import { seedDefaultCategories } from './controllers/categoryController.js';
import {
  initReminderWorker,
  initializeReminders,
  closeReminderQueue
} from './services/reminderQueue.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/categories', categoryRoutes);

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
    await seedDefaultCategories();

    // Start the BullMQ worker (connects to Redis, or falls back to in-memory)
    await initReminderWorker();

    // Re-schedule reminders for existing pending tasks
    await initializeReminders();

    console.log('MongoDB connected');
    console.log('PostgreSQL connected');

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    return server;
  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  await Promise.allSettled([
    mongoose.connection.close(),
    closePostgres(),
    closeReminderQueue()
  ]);
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
