// This file will act as our "bouncer" middleware

const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // 1. Get token from the request header
  const token = req.header('Authorization');

  // 2. Check if there's no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // 3. If there is a token, verify it
  try {
    // The token format is "Bearer <token>". We just want the token part.
    const justToken = token.split(' ')[1];
    
    // In a real app, this secret should be in a .env file!
    const secretKey = 'mySuperSecretKey123!'; 

    const decoded = jwt.verify(justToken, secretKey);

    // Add the user's info from the token payload to the request object
    req.user = decoded.user;
    next(); // Let the request proceed to the actual route

  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};