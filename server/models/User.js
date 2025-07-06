const mongoose = require('mongoose');
const { validatePassword, isPasswordHash } = require('../utils/password.js');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'clinic', 'affiliate', 'wholesale'],
    default: 'clinic'
  },
  companyName: {
    type: String
  },
  subscriptionStatus: {
    type: String,
    enum: ['trial', 'active', 'inactive', 'cancelled'],
    default: 'trial'
  },
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  phone: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  refreshToken: {
    type: String
  }
}, {
  timestamps: true
});

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);