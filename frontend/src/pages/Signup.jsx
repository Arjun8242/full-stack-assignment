import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import api from '../api/axios';

function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name || !formData.email || !formData.password) {
      toast.error('All fields are required');
      return;
    }

    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', formData);

      if (data.success) {
        localStorage.setItem('userName', data.user?.name || data.user?.email || 'User');
        toast.success(`Welcome, ${data.user?.name || data.user?.email || 'User'}!`);
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
      <h2 className="heading">Signup</h2>
      <form onSubmit={handleSubmit}>
        <Input
          label="Name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
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
          {loading ? 'Creating Account...' : 'Signup'}
        </Button>
      </form>
      <div className="link-text">
        Already have an account? <Link to="/login" className="link">Login</Link>
      </div>
    </Card>
  );
}

export default Signup;
