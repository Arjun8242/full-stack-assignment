import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import api from '../api/axios';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/dashboard');
      setDashboardData(data);
    } catch (err) {
      toast.error('Failed to load dashboard');
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
      localStorage.removeItem('userName');
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  if (!dashboardData) return <div>Loading...</div>;

  return (
    <Card large>
      <div className="dashboard-header">
        <h2 className="welcome-text">{dashboardData.message}</h2>
        <Button variant="danger" onClick={handleLogout}>Logout</Button>
      </div>

      {/* Leads Section */}
      <div className="dashboard-section">
        <h3 className="section-title">Leads</h3>
        <div className="data-table">
          <div className="table-header">
            <span>Name</span>
            <span>Email</span>
            <span>Status</span>
            <span>Value</span>
          </div>
          {dashboardData.data.leads.map((lead) => (
            <div key={lead.id} className="table-row">
              <span>{lead.name}</span>
              <span>{lead.email}</span>
              <span className={`status status-${lead.status.toLowerCase()}`}>{lead.status}</span>
              <span>{lead.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks Section */}
      <div className="dashboard-section">
        <h3 className="section-title">Tasks</h3>
        <div className="data-table">
          <div className="table-header">
            <span>Title</span>
            <span>Priority</span>
            <span>Due Date</span>
            <span>Status</span>
          </div>
          {dashboardData.data.tasks.map((task) => (
            <div key={task.id} className="table-row">
              <span>{task.title}</span>
              <span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
              <span>{task.dueDate}</span>
              <span>{task.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Users Section */}
      <div className="dashboard-section">
        <h3 className="section-title">Users</h3>
        <div className="data-table">
          <div className="table-header">
            <span>Name</span>
            <span>Role</span>
            <span>Email</span>
            <span>Status</span>
          </div>
          {dashboardData.data.users.map((user) => (
            <div key={user.id} className="table-row">
              <span>{user.name}</span>
              <span>{user.role}</span>
              <span>{user.email}</span>
              <span className={`user-status user-status-${user.status.toLowerCase()}`}>{user.status}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default Dashboard;
