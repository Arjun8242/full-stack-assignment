import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import { errorHandler, notFound } from './utils/errorHandler.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://full-stack-assignment-xfkz.onrender.com',
    'https://full-stack-assignment-weld.vercel.app'
  ],
  credentials: true
}));
app.use(cookieParser());

// Routes
app.use('/', authRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  mongoose.connection.close();
  process.exit(0);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

