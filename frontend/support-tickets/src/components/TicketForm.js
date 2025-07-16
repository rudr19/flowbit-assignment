import React, { useState } from 'react';
import { api } from '../../../shared/src/api';

const TicketForm = () => {
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    priority: 'Medium',
    category: 'General',
    tags: [] 
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!form.title.trim()) {
        throw new Error('Title is required');
      }
      if (!form.description.trim()) {
        throw new Error('Description is required');
      }
      const ticketData = {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        category: form.category,
        tags: form.tags.filter(tag => tag.trim() !== '') 
      };

      console.log('Submitting ticket:', ticketData);

      const response = await api.post('/api/tickets', ticketData);
      
      console.log('Ticket created successfully:', response.data);
      setForm({ 
        title: '', 
        description: '', 
        priority: 'Medium',
        category: 'General',
        tags: []
      });
      
      alert('Ticket submitted successfully!');
      
    } catch (err) {
      console.error('Failed to create ticket:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create ticket';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Create Support Ticket</h2>
      
      {error && (
        <div style={{ 
          color: 'red', 
          background: '#ffebee', 
          padding: '10px', 
          border: '1px solid #ffcdd2',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="title">Title *</label>
          <input 
            id="title"
            name="title" 
            placeholder="Enter ticket title" 
            value={form.title} 
            onChange={handleChange} 
            required 
            maxLength={200}
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="description">Description *</label>
          <textarea 
            id="description"
            name="description" 
            placeholder="Describe your issue in detail" 
            value={form.description} 
            onChange={handleChange} 
            required 
            maxLength={2000}
            rows={6}
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="priority">Priority</label>
          <select 
            id="priority"
            name="priority" 
            value={form.priority} 
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="category">Category</label>
          <select 
            id="category"
            name="category" 
            value={form.category} 
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="General">General</option>
            <option value="Technical">Technical</option>
            <option value="Billing">Billing</option>
            <option value="Feature Request">Feature Request</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
};

export default TicketForm;