const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  customerId: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['Admin', 'User'],
    default: 'User'
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
userSchema.index({ customerId: 1, email: 1 });
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};
userSchema.statics.findByEmailAndTenant = function (email, customerId) {
  return this.findOne({ email, customerId, isActive: true });
};

module.exports = mongoose.model('User', userSchema);
