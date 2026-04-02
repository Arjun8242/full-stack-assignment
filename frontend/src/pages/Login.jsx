import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import api from '../api/axios';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.email || !formData.password) {
      toast.error('All fields are required');
      return;
    }

    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', formData);

      if (data.success) {
        localStorage.setItem('userName', data.user?.name || data.user?.email || 'User');
        toast.success(`Welcome back, ${data.user?.name || data.user?.email || 'User'}!`);
        navigate('/dashboard');
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="heading">Login</h2>
      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      <div className="link-text">
        Don't have an account? <Link to="/signup" className="link">Signup</Link>
      </div>
    </Card>
  );
}

export default Login;
