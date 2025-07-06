const jwt = require('jsonwebtoken');

/**
 * Generates an access token for the user
 * @param {Object} user - User object
 * @returns {string} JWT access token
 */
const generateAccessToken = (user) => {
  console.log('=== GENERATING ACCESS TOKEN ===');
  console.log('User ID:', user._id);
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
  
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    throw new Error('JWT_SECRET is not configured');
  }
  
  const token = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  console.log('Access token generated successfully');
  return token;
};

/**
 * Generates a refresh token for the user
 * @param {Object} user - User object
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (user) => {
  console.log('=== GENERATING REFRESH TOKEN ===');
  console.log('User ID:', user._id);
  console.log('JWT_REFRESH_SECRET exists:', !!process.env.JWT_REFRESH_SECRET);
  console.log('JWT_REFRESH_SECRET length:', process.env.JWT_REFRESH_SECRET ? process.env.JWT_REFRESH_SECRET.length : 0);
  
  if (!process.env.JWT_REFRESH_SECRET) {
    console.error('JWT_REFRESH_SECRET is not defined in environment variables');
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }
  
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  console.log('Refresh token generated successfully');
  return token;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};