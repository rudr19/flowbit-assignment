const express = require('express');
const Ticket = require('../models/Ticket');

const router = express.Router();
const verifyWebhookSecret = (req, res, next) => {
  const receivedSecret = req.headers['x-webhook-secret'] || req.body.secret;
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.error('WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (receivedSecret !== expectedSecret) {
    console.error('Invalid webhook secret received');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};
router.post('/ticket-done', verifyWebhookSecret, async (req, res) => {
  try {
    const { ticketId, status, workflowStatus, resolution, metadata } = req.body;

    console.log('Webhook received:', { ticketId, status, workflowStatus });

    if (!ticketId) {
      return res.status(400).json({ error: 'ticketId is required' });
    }
    const ticket = await Ticket.findById(ticketId)
      .populate('userId', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    const updates = {};

    if (status) {
      updates.status = status;
    }

    if (workflowStatus) {
      updates.workflowStatus = workflowStatus;
    }

    if (resolution) {
      updates.resolution = resolution;
    }
    if (metadata) {
      updates.metadata = metadata;
    }
    if (workflowStatus === 'Completed' && !status) {
      updates.status = 'In Progress';
    }
    Object.assign(ticket, updates);
    await ticket.save();
    const io = req.app.get('io');
    if (io) {
      io.to(ticket.customerId).emit('ticket-updated', ticket);
      io.to(ticket.customerId).emit('ticket-webhook-processed', {
        ticketId: ticket._id,
        status: ticket.status,
        workflowStatus: ticket.workflowStatus,
        timestamp: new Date()
      });
    }

    console.log(`Ticket ${ticketId} updated via webhook:`, updates);

    res.json({
      success: true,
      ticket: {
        id: ticket._id,
        status: ticket.status,
        workflowStatus: ticket.workflowStatus,
        updatedAt: ticket.updatedAt
      }
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.post('/ticket-process', verifyWebhookSecret, async (req, res) => {
  try {
    const { ticketId, action, data } = req.body;

    console.log('Ticket process webhook received:', { ticketId, action });

    if (!ticketId) {
      return res.status(400).json({ error: 'ticketId is required' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    switch (action) {
      case 'start_processing':
        ticket.workflowStatus = 'In Progress';
        ticket.status = 'In Progress';
        break;
      
      case 'processing_complete':
        ticket.workflowStatus = 'Completed';
        ticket.status = 'Resolved';
        if (data?.resolution) {
          ticket.resolution = data.resolution;
        }
        break;
      
      case 'processing_failed':
        ticket.workflowStatus = 'Failed';
        break;
      
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }

    await ticket.save();
    const io = req.app.get('io');
    if (io) {
      io.to(ticket.customerId).emit('ticket-updated', ticket);
    }

    res.json({
      success: true,
      ticket: {
        id: ticket._id,
        status: ticket.status,
        workflowStatus: ticket.workflowStatus
      }
    });

  } catch (error) {
    console.error('Ticket process webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'webhook',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;