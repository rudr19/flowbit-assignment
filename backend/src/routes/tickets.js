const express = require('express');
const Joi = require('joi');
const axios = require('axios');
const Ticket = require('../models/Ticket');
const { ensureTenantIsolation, addTenantToBody } = require('../middleware/tenantIsolation');
const { requireAdminForRoute } = require('../middleware/auth');

const router = express.Router();

router.use(ensureTenantIsolation);
const createTicketSchema = Joi.object({
  title: Joi.string().max(200).required(),
  description: Joi.string().max(2000).required(),
  priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').default('Medium'),
  category: Joi.string().valid('Technical', 'Billing', 'General', 'Feature Request').default('General'),
  tags: Joi.array().items(Joi.string()).optional()
});

const updateTicketSchema = Joi.object({
  title: Joi.string().max(200).optional(),
  description: Joi.string().max(2000).optional(),
  status: Joi.string().valid('Open', 'In Progress', 'Resolved', 'Closed').optional(),
  priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional(),
  category: Joi.string().valid('Technical', 'Billing', 'General', 'Feature Request').optional(),
  resolution: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional()
});
const triggerN8nWorkflow = async (ticketData) => {
  try {
    const n8nUrl = process.env.N8N_WEBHOOK_URL || 'http://n8n:5678/webhook/ticket-process';
    
    const response = await axios.post(n8nUrl, {
      ticketId: ticketData._id.toString(),
      customerId: ticketData.customerId,
      title: ticketData.title,
      description: ticketData.description,
      priority: ticketData.priority,
      category: ticketData.category,
      userId: ticketData.userId,
      createdAt: ticketData.createdAt,
      callbackUrl: `${process.env.FLOWBIT_WEBHOOK_URL || 'http://api:3001'}/webhook/ticket-done`,
      secret: process.env.WEBHOOK_SECRET
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('N8N workflow triggered successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to trigger N8N workflow:', error.message);
    throw error;
  }
};
router.get('/', async (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 10 } = req.query;
    
    const filter = { customerId: req.user.customerId };
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const skip = (page - 1) * limit;
    
    const tickets = await Ticket.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Ticket.countDocuments(filter);

    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/stats', async (req, res) => {
  try {
    const statusCounts = await Ticket.getStatusCounts(req.user.customerId);
    
    const stats = {
      total: 0,
      byStatus: {},
      byPriority: {}
    };
    statusCounts.forEach(item => {
      stats.byStatus[item._id] = item.count;
      stats.total += item.count;
    });
    const priorityCounts = await Ticket.aggregate([
      { $match: { customerId: req.user.customerId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    priorityCounts.forEach(item => {
      stats.byPriority[item._id] = item.count;
    });

    res.json(stats);

  } catch (error) {
    console.error('Get ticket stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      customerId: req.user.customerId
    })
    .populate('userId', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email')
    .populate('comments.userId', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);

  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { error, value } = createTicketSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const ticket = new Ticket({
      ...value,
      customerId: req.user.customerId,
      userId: req.user.userId
    });

    await ticket.save();
    await ticket.populate('userId', 'firstName lastName email');
    try {
      await triggerN8nWorkflow(ticket);
      ticket.workflowStatus = 'In Progress';
      await ticket.save();
    } catch (workflowError) {
      console.error('Workflow trigger failed:', workflowError);
      ticket.workflowStatus = 'Failed';
      await ticket.save();
    }
    req.io.to(req.user.customerId).emit('ticket-created', ticket);

    res.status(201).json(ticket);

  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.put('/:id', async (req, res) => {
  try {
    const { error, value } = updateTicketSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, customerId: req.user.customerId },
      value,
      { new: true, runValidators: true }
    )
    .populate('userId', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    req.io.to(req.user.customerId).emit('ticket-updated', ticket);

    res.json(ticket);

  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findOneAndDelete({
      _id: req.params.id,
      customerId: req.user.customerId
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    req.io.to(req.user.customerId).emit('ticket-deleted', { id: ticket._id });

    res.json({ message: 'Ticket deleted successfully' });

  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.post('/:id/comments', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      customerId: req.user.customerId
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    ticket.comments.push({
      userId: req.user.userId,
      content: content.trim()
    });

    await ticket.save();
    await ticket.populate('comments.userId', 'firstName lastName email');

    req.io.to(req.user.customerId).emit('ticket-comment-added', {
      ticketId: ticket._id,
      comment: ticket.comments[ticket.comments.length - 1]
    });

    res.json(ticket.comments[ticket.comments.length - 1]);

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;