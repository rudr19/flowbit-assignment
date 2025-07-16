import React from 'react';
import TicketList from './components/TicketList';
import TicketForm from './components/TicketForm';

const SupportTicketsApp = () => (
  <div style={{ padding: '2rem' }}>
    <h1>Support Tickets</h1>
    <TicketForm />
    <TicketList />
  </div>
);

export default SupportTicketsApp;
