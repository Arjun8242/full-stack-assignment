import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ success: true, message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const isProduction = process.env.NODE_ENV === 'production';

    // Set httpOnly cookie with environment-based settings
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction, // Only HTTPS in production
      sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-origin in production
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.json({ success: true, name: user.name });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

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

export const getDashboard = (req, res) => {
  const dummyData = {
    leads: [
      { id: 1, name: 'John Doe', email: 'john@example.com', status: 'New', value: '$5,000' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Contacted', value: '$8,500' },
      { id: 3, name: 'Mike Johnson', email: 'mike@example.com', status: 'Qualified', value: '$12,000' },
      { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', status: 'Negotiation', value: '$15,000' }
    ],
    tasks: [
      { id: 1, title: 'Follow up with client', priority: 'High', dueDate: '2024-03-28', status: 'Pending' },
      { id: 2, title: 'Prepare presentation', priority: 'Medium', dueDate: '2024-03-29', status: 'In Progress' },
      { id: 3, title: 'Review contract', priority: 'High', dueDate: '2024-03-27', status: 'Completed' },
      { id: 4, title: 'Send proposal', priority: 'Low', dueDate: '2024-03-30', status: 'Pending' }
    ],
    users: [
      { id: 1, name: 'Alice Brown', role: 'Sales Manager', email: 'alice@company.com', status: 'Active' },
      { id: 2, name: 'Bob Wilson', role: 'Developer', email: 'bob@company.com', status: 'Active' },
      { id: 3, name: 'Carol Davis', role: 'Designer', email: 'carol@company.com', status: 'Active' },
      { id: 4, name: 'David Lee', role: 'Marketing', email: 'david@company.com', status: 'Inactive' }
    ]
  };

  res.json({
    message: `Welcome ${req.user.name}`,
    data: dummyData
  });
};
