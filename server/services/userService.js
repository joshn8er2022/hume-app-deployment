const { randomUUID } = require('crypto');

const User = require('../models/User.js');
const { generatePasswordHash, validatePassword } = require('../utils/password.js');

/**
 * Create a new user
 */
const create = async (userData) => {
  const { email, password, role, companyName, subscriptionStatus, firstName, lastName, phone } = userData;

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash the password
  const hashedPassword = await generatePasswordHash(password);

  // Create new user
  const user = new User({
    email: email.toLowerCase(),
    password: hashedPassword,
    role: role || 'clinic',
    companyName: companyName || '',
    subscriptionStatus: subscriptionStatus || 'trial',
    firstName: firstName || '',
    lastName: lastName || '',
    phone: phone || '',
  });

  await user.save();
  console.log(`New user created: ${user.email} with role: ${user.role}`);
  return user;
};

/**
 * Get user by ID
 */
const get = async (id) => {
  return await User.findById(id);
};

/**
 * Get user by email
 */
const getByEmail = async (email) => {
  return await User.findOne({ email: email.toLowerCase() });
};

/**
 * Authenticate user with password
 */
const authenticateWithPassword = async (email, password) => {
  const user = await getByEmail(email);
  if (!user) {
    return null;
  }

  const isValid = await validatePassword(password, user.password);
  if (!isValid) {
    return null;
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  console.log(`User authenticated: ${user.email}`);
  return user;
};

/**
 * Update user
 */
const update = async (id, updateData) => {
  // Remove sensitive fields that shouldn't be updated directly
  const { password, refreshToken, ...safeUpdateData } = updateData;
  
  const user = await User.findByIdAndUpdate(id, safeUpdateData, { new: true });
  if (user) {
    console.log(`User profile updated: ${user.email}`);
  }
  return user;
};

/**
 * Delete user
 */
const deleteUser = async (id) => {
  return await User.findByIdAndDelete(id);
};

/**
 * List users with pagination
 */
const list = async (options = {}) => {
  const { page = 1, limit = 10, search = '' } = options;
  const skip = (page - 1) * limit;

  let query = {};
  if (search) {
    query.email = { $regex: search, $options: 'i' };
  }

  const users = await User.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  return {
    users,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

/**
 * Set user password
 */
const setPassword = async (userId, newPassword) => {
  const hashedPassword = await generatePasswordHash(newPassword);
  return await User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true });
};

module.exports = {
  create,
  get,
  getByEmail,
  authenticateWithPassword,
  update,
  delete: deleteUser,
  list,
  setPassword
};