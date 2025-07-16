const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  customerId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  category: {
    type: String,
    enum: ['Technical', 'Billing', 'General', 'Feature Request'],
    default: 'General'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  workflowId: {
    type: String,
    trim: true
  },
  workflowStatus: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'Failed'],
    default: 'Not Started'
  },
  resolution: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  }
});
ticketSchema.index({ customerId: 1, status: 1 });
ticketSchema.index({ customerId: 1, userId: 1 });
ticketSchema.index({ customerId: 1, createdAt: -1 });
ticketSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.isModified('status') && this.status === 'Resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  next();
});
ticketSchema.statics.findByTenant = function (customerId, filter = {}) {
  return this.find({ customerId, ...filter })
    .populate('userId', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email')
    .sort({ createdAt: -1 });
};
ticketSchema.statics.getStatusCounts = function (customerId) {
  return this.aggregate([
    { $match: { customerId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('Ticket', ticketSchema);
