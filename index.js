console.log("--- SERVER STARTING ---");

// ====== IMPORTS ======
const express = require('express');
const pool = require('./db');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // <-- 1. IMPORT JWT LIBRARY
const auth = require('./auth'); 

// ====== SETUP ======
const app = express();
const port = 3000;

// ====== MIDDLEWARE ======
app.use(cors());
app.use(express.json());

// ====== ROUTES ======

app.get('/', (req, res) => {
  res.send('Backend server is alive! Endpoints: POST /api/signup, POST /api/login');
});

// --- SIGNUP ROUTE (Unchanged) ---
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
    console.error("Error in /api/signup:", err.message);
    res.status(500).json({ message: 'Server error during signup' });
  }
});


// --- LOGIN ROUTE WITH JWT TOKEN GENERATION ---
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
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 2. --- CREATE THE JWT PAYLOAD ---
    // The "payload" is the information we want to embed in the token.
    // We only need the user's unique ID to identify them in future requests.
    const payload = {
      user: {
        id: user.id
      }
    };

    // 3. --- SIGN AND SEND THE TOKEN ---
    // This creates the token and sends it back to the user.
    // In a real production app, this 'secretKey' should be a long, complex string
    // stored securely in an environment variable file (.env), not in the code.
    const secretKey = 'mySuperSecretKey123!';

    jwt.sign(
      payload,
      secretKey,
      { expiresIn: '1h' }, // Token is valid for 1 hour
      (err, token) => {
        if (err) throw err;
        // The response now includes the token
        res.status(200).json({
          message: "Login successful!",
          token: token // This is the user's "wristband"
        });
      }
    );

  } catch (err) {
    console.error("Error in /api/login:", err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// --- NEW: PROTECTED DASHBOARD DATA ROUTE ---
// Notice we put `auth` right after the path. This means our "bouncer"
// will run before the main route logic.
app.get('/api/dashboard', auth, async (req, res) => {
  try {
    // The `auth` middleware added `req.user` for us. It contains the user's id.
    const userId = req.user.id;

    // Fetch user details from the database, but NEVER the password hash.
    const user = await pool.query(
      "SELECT id, username, email FROM users WHERE id = $1",
      [userId]
    );

    if (user.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
    }

    // Send the user's data back to the frontend
    res.json(user.rows[0]);

  } catch (err) {
    console.error("Error in /api/dashboard:", err.message);
    res.status(500).send("Server Error");
  }
});

// ====== START SERVER ======
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});