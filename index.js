// === index.js (FINAL & BULLETPROOFED) ===
// The complete, assembled, and working backend server.
// ====================================================

console.log("--- SERVER STARTING ---");

// ====== IMPORTS ======
// We bring in all our tools and the modules we created.
const express = require('express');
const pool = require('./db');      // Our new, bulletproof db connection
const auth = require('./auth');    // Our new, bulletproof auth "bouncer"
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// ====== SETUP ======
const app = express();
const port = process.env.PORT || 3000;

// ====== MIDDLEWARE ======
// This section prepares our server to handle requests.

// --- Production-Ready CORS Configuration ---
const allowedOrigins = ['https://versa-pdfs.vercel.app'];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
};
app.use(cors(corsOptions));

// --- JSON Body Parser ---
// This allows our server to read JSON data sent from the frontend.
app.use(express.json());


// ====== ROUTES ======
// This is the heart of our API.

// --- Health Check Route ---
// A simple route to confirm the server is alive.
app.get('/', (req, res) => {
  res.send('Backend server is alive! Endpoints: POST /api/signup, POST /api/login');
});

// --- SIGNUP ROUTE ---
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required." });
    }
    const user = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $2", [username, email]);
    if (user.rows.length > 0) {
      return res.status(400).json({ message: "Username or email already exists." });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, passwordHash]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error("Error in /api/signup:", err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// --- LOGIN ROUTE ---
app.post('/api/login', async (req, res) => {
  try {
    const { loginIdentifier, password } = req.body;
    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: "Username/email and password are required." });
    }
    const userResult = await pool.query("SELECT * FROM users WHERE username = $1 OR email = $1", [loginIdentifier]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const user = userResult.rows[0];

    // ✅ The crucial bug fix: Always check if the password hash exists before using it.
    if (!user.password_hash) {
      console.error(`CRITICAL: User '${user.username}' (ID: ${user.id}) has no password hash in the database.`);
      return res.status(500).json({ message: "Server configuration error. Please contact support." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const payload = { user: { id: user.id } };
    const secretKey = process.env.JWT_SECRET || 'mySuperSecretKey123!';
    jwt.sign(
      payload,
      secretKey,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({ message: "Login successful!", token });
      }
    );
  } catch (err) {
    console.error("Error in /api/login:", err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// --- PROTECTED DASHBOARD ROUTE ---
// Notice how we put our `auth` middleware right here. It runs before the main logic.
app.get('/api/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await pool.query("SELECT id, username, email FROM users WHERE id = $1", [userId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.rows[0]);
  } catch (err) {
    console.error("Error in /api/dashboard:", err);
    // ✅ Tiny fix for consistency: sending JSON error object.
    res.status(500).json({ message: "Server Error" });
  }
});


// ====== START SERVER ======
// The final command that brings our server to life.
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});