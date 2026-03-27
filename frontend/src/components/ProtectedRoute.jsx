import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api/axios';

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    try {
      await api.get('/dashboard');
      setIsAuthenticated(true);
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      setIsAuthenticated(false);
    }
  };

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;
