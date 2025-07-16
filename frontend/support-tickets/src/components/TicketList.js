import React, { useEffect, useState } from 'react';
import { api } from '../../../shared/src/api';
import { io } from 'socket.io-client';
import { getToken } from '../../../shared/src/auth';

const TicketList = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/api/tickets');
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const socket = io('http://localhost:3001', {
      auth: {
        token: getToken()
      }
    });
    api.get('/api/me/profile').then(res => {
      const customerId = res.data?.user?.customerId;
      if (customerId) {
        socket.emit('join-tenant', customerId);
        console.log(`✅ Joined room for tenant: ${customerId}`);
      }
    });
    socket.on('ticket-created', (ticket) => {
      console.log('📥 Ticket created:', ticket);
      setTickets(prev => [ticket, ...prev]);
    });

    socket.on('ticket-updated', (updated) => {
      console.log('🔁 Ticket updated:', updated);
      setTickets(prev =>
        prev.map(t => (t._id === updated._id ? updated : t))
      );
    });

    socket.on('ticket-deleted', ({ id }) => {
      console.log('🗑️ Ticket deleted:', id);
      setTickets(prev => prev.filter(t => t._id !== id));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h2>Tickets</h2>
      {loading ? (
        <p>Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p>No tickets found.</p>
      ) : (
        <ul>
          {tickets.map(ticket => (
            <li key={ticket._id}>
              <strong>{ticket.title}</strong> - {ticket.status} ({ticket.priority})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TicketList;
