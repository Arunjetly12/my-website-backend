// 1. Import Express
const express = require('express');

// 2. Create an instance of the Express app
const app = express();

// 3. Define a port for our server to listen on.
// We use a high number like 5000 so it doesn't clash with your frontend (which often runs on 3000)
const PORT = 5000;

// 4. Create our first "route". This tells the server what to do
// when someone visits the main URL (like http://localhost:5000/)
app.get('/', (req, res) => {
  // req = request (data coming from the user)
  // res = response (what we send back to the user)
  res.send('Hello from the Backend! You did it!');
});

// 5. Start the server and make it listen for requests on our port
app.listen(PORT, () => {
  console.log(`Server is running and listening on http://localhost:${PORT}`);
});