// === index.js (FINAL & BULLETPROOFED) ===
// The complete, assembled, and working backend server.
// ====================================================

console.log("--- SERVER STARTING ---");

// ====== IMPORTS ======
const express = require('express');
const pool = require('./db');       // DB connection
const auth = require('./auth');     // Auth middleware
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// ====== SETUP ======
const app = express();
const port = process.env.PORT || 3000;

// ====== MIDDLEWARE ======

// --- Updated Production-Ready CORS Configuration ---
const allowedOrigins = [
  'https://versa-pdfs.vercel.app', // ✅ your frontend
  'http://localhost:5500',         // ✅ local testing
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// --- JSON Body Parser ---
app.use(express.json());


// ====== ROUTES ======

// --- Health Check Route ---
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

    const user = await pool.query(
      "SELECT * FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

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

    const userResult = await pool.query(
      "SELECT * FROM users WHERE username = $1 OR email = $1",
      [loginIdentifier]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = userResult.rows[0];

    if (!user.password_hash) {
      console.error(`CRITICAL: User '${user.username}' (ID: ${user.id}) has no password hash.`);
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
app.get('/api/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await pool.query(
      "SELECT id, username, email FROM users WHERE id = $1",
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.rows[0]);

  } catch (err) {
    console.error("Error in /api/dashboard:", err);
    res.status(500).json({ message: "Server Error" });
  }
});


// ====== START SERVER ======
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
