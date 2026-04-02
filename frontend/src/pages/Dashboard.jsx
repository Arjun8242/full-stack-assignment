import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import api from '../api/axios';

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, tasksRes] = await Promise.all([
        api.get('/auth/profile'),
        api.get('/tasks')
      ]);

      setProfile(profileRes.data.user);
      setTasks(tasksRes.data.tasks || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load dashboard');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      await api.post('/tasks', {
        title: newTitle.trim(),
        description: newDescription.trim()
      });
      setNewTitle('');
      setNewDescription('');
      toast.success('Task created');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleToggleTask = async (task) => {
    try {
      await api.patch(`/tasks/${task.id}`, {
        status: task.status === 'completed' ? 'pending' : 'completed'
      });
      toast.success('Task updated');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const startEditingTask = (task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title || '');
    setEditDescription(task.description || '');
  };

  const cancelEditingTask = () => {
    setEditingTaskId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleSaveTask = async (taskId) => {
    const title = editTitle.trim();
    const description = editDescription.trim();

    if (!title) {
      toast.error('Title is required');
      return;
    }

    try {
      await api.patch(`/tasks/${taskId}`, {
        title,
        description
      });

      toast.success('Task updated');
      cancelEditingTask();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('userName');
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card large>
      <div className="dashboard-header">
        <h2 className="welcome-text">
          Welcome, {profile?.name || profile?.email || 'User'}
        </h2>
        <Button variant="danger" onClick={handleLogout}>Logout</Button>
      </div>

      <div className="dashboard-section">
        <h3 className="section-title">Create Task</h3>
        <form onSubmit={handleCreateTask}>
          <Input
            label="Title"
            name="title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Input
            label="Description"
            name="description"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <Button type="submit">Add Task</Button>
        </form>
      </div>

      <div className="dashboard-section">
        <h3 className="section-title">Tasks</h3>
        <div className="data-table">
          <div className="table-header">
            <span>Title</span>
            <span>Description</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {tasks.map((task) => (
            <div key={task.id} className="table-row">
              {editingTaskId === task.id ? (
                <>
                  <input
                    className="input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Task title"
                  />
                  <input
                    className="input"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Task description"
                  />
                </>
              ) : (
                <>
                  <span>{task.title}</span>
                  <span>{task.description || '-'}</span>
                </>
              )}
              <span>{task.status}</span>
              <span className="task-actions">
                {editingTaskId === task.id ? (
                  <>
                    <button
                      className="link-btn"
                      onClick={() => handleSaveTask(task.id)}
                      type="button"
                    >
                      Save
                    </button>
                    <button
                      className="link-btn"
                      onClick={cancelEditingTask}
                      type="button"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="link-btn"
                      onClick={() => startEditingTask(task)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="link-btn"
                      onClick={() => handleToggleTask(task)}
                      type="button"
                    >
                      Toggle
                    </button>
                  </>
                )}
                <button
                  className="link-btn danger"
                  onClick={() => handleDeleteTask(task.id)}
                  type="button"
                >
                  Delete
                </button>
              </span>
            </div>
          ))}
          {!tasks.length && (
            <div className="table-row">
              <span>No tasks yet</span>
              <span>-</span>
              <span>-</span>
              <span>-</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default Dashboard;
