import { useEffect, useState } from 'react';
import { api } from '../../../shared/src/api';


export const useTickets = () => {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    api.get('/api/tickets').then(res => {
      setTickets(res.data.tickets || []);
    });
  }, []);

  return tickets;
};
export const useTicket = (ticketId) => {
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    if (ticketId) {
      api.get(`/api/tickets/${ticketId}`).then(res => {
        setTicket(res.data.ticket);
      });
    }
  }, [ticketId]);

  return ticket;
};