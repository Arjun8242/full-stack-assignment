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
  const [categories, setCategories] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  
  // Category management & filtering state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTags, setFilterTags] = useState('');

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterTags]); // Refetch when filters change

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (filterTags) params.append('tags', filterTags);

      const [profileRes, tasksRes, categoriesRes] = await Promise.all([
        api.get('/auth/profile'),
        api.get(`/tasks?${params.toString()}`),
        api.get('/categories')
      ]);

      setProfile(profileRes.data.user);
      setTasks(tasksRes.data.tasks || []);
      setCategories(categoriesRes.data.categories || []);
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
         description: newDescription.trim(),
         category: newCategory.trim() || null,
         tags: newTags.split(',').map(tag => tag.trim()).filter(Boolean),
         dueDate: newDueDate || null
      });
      setNewTitle('');
      setNewDescription('');
      setNewCategory('');
      setNewTags('');
      setNewDueDate('');
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
    setEditCategory(task.category || '');
    setEditTags(task.tags ? task.tags.join(', ') : '');
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '');
  };

  const cancelEditingTask = () => {
    setEditingTaskId(null);
    setEditTitle('');
    setEditDescription('');
    setEditCategory('');
    setEditTags('');
    setEditDueDate('');
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
        description,
        category: editCategory.trim() || null,
        tags: editTags.split(',').map(tag => tag.trim()).filter(Boolean),
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : null
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

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return toast.error('Category name needed');
    try {
      await api.post('/categories', { name: newCategoryName.trim() });
      setNewCategoryName('');
      toast.success('Category created');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await api.delete(`/categories/${categoryId}`);
      toast.success('Category deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
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
          <div className="form-group">
            <label className="label">Category</label>
            <select
              className="input"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Tags (comma separated)"
            name="tags"
            placeholder="e.g. Work, Urgent"
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
          />
          <Input
             label="Due Date (optional)"
             name="dueDate"
             type="datetime-local"
             value={newDueDate}
             onChange={(e) => setNewDueDate(e.target.value)}
          />
          <Button type="submit">Add Task</Button>
        </form>
      </div>

      <div className="dashboard-section" style={{ background: '#f0f4f8', padding: '15px', borderRadius: '8px' }}>
        <h3 className="section-title">Manage Categories</h3>
        <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            className="input"
            placeholder="New category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <Button type="submit" style={{ marginTop: 0, width: 'auto' }}>Add</Button>
        </form>
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
             <span key={cat.id} style={{ background: 'white', padding: '5px 10px', borderRadius: '15px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
               {cat.name} 
               {!cat.isSystemDefault && (
                 <button onClick={() => handleDeleteCategory(cat.id)} style={{ border: 'none', background: 'transparent', color: 'red', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
               )}
               {cat.isSystemDefault && <span style={{color: '#999', fontSize: '10px'}}>(default)</span>}
             </span>
          ))}
        </div>
      </div>

      <div className="dashboard-section" style={{ overflowX: 'auto' }}>
        <h3 className="section-title">Tasks</h3>
        
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <div style={{ flex: 1 }}>
            <label className="label">Filter by Category:</label>
            <select className="input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Filter by Tags (comma separated):</label>
            <input 
               className="input" 
               placeholder="e.g. Critical, Frontpage" 
               value={filterTags} 
               onChange={(e) => setFilterTags(e.target.value)} 
            />
          </div>
        </div>

        <div className="data-table" style={{ minWidth: '800px' }}>
          <div className="table-header">
            <span>Title</span>
            <span>Desc / Tags</span>
            <span>Category</span>
            <span>Due</span>
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
                    placeholder="Title"
                  />
                  <div>
                    <input
                      className="input"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Desc"
                      style={{ marginBottom: '4px' }}
                    />
                    <input
                      className="input"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="Tags (CSV)"
                    />
                  </div>
                  <select
                     className="input"
                     value={editCategory}
                     onChange={(e) => setEditCategory(e.target.value)}
                   >
                     <option value="">None</option>
                     {categories.map((cat) => (
                       <option key={cat.id} value={cat.name}>
                         {cat.name}
                       </option>
                     ))}
                   </select>
                   <input
                     className="input"
                     type="datetime-local"
                     value={editDueDate}
                     onChange={(e) => setEditDueDate(e.target.value)}
                   />
                </>
              ) : (
                <>
                  <span>{task.title}</span>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', borderBottom: '1px solid #eee', marginBottom: '4px' }}>
                      {task.description || '-'}
                    </div>
                    <div>{task.tags?.length ? task.tags.join(', ') : '-'}</div>
                  </div>
                  <span>{task.category || '-'}</span>
                  <span style={{ fontSize: '12px' }}>{task.dueDate ? new Date(task.dueDate).toLocaleString() : '-'}</span>
                </>
              )}
              <span>{task.status}</span>
              <span className="task-actions">
                {editingTaskId === task.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                    <button
                      className="link-btn danger"
                      onClick={() => handleDeleteTask(task.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </span>
            </div>
          ))}
          {!tasks.length && (
            <div className="table-row">
              <span>No tasks yet</span>
              <span>-</span>
              <span>-</span>
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
