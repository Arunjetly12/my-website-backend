// === auth.js (FINAL & BULLETPROOFED) ===
// This file is our "bouncer" middleware for protected routes.

const jwt = require('jsonwebtoken');
require('dotenv').config(); // Make sure we can access environment variables

module.exports = function(req, res, next) {
  // 1. Get token from the request header
  const authHeader = req.header('Authorization');

  // 2. Check if the header exists and is in the correct "Bearer <token>" format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token or invalid format, authorization denied' });
  }

  // 3. If there is a token, verify it
  try {
    // The token format is "Bearer <token>". We split the string and get the second part.
    const token = authHeader.split(' ')[1];
    
    // ✅ This is the only change: We get the secret from environment variables first.
    // This makes your app more secure. It will fall back to your hardcoded key if not found.
    const secretKey = process.env.JWT_SECRET || 'mySuperSecretKey123!';

    // Verify the token and decode the payload
    const decoded = jwt.verify(token, secretKey);

    // Add the user's info (e.g., their ID) from the token to the request object
    req.user = decoded.user;
    
    // Let the request proceed to the actual route (e.g., /api/dashboard)
    next(); 

  } catch (err) {
    // This will catch expired tokens, malformed tokens, etc.
    console.error('Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};