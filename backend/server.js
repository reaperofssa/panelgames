const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

require("./telegrambot");

const dbFile = path.join(__dirname, "db.json");
let db = JSON.parse(fs.readFileSync(dbFile));

// Helper to save database to file
const saveDB = () => fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));

// Serve static files (HTML, CSS, JS) from the frontend directory
app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.json());

// Routes to serve specific HTML files
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "../frontend/index.html")));
app.get("/home", (req, res) => res.sendFile(path.join(__dirname, "../frontend/home.html")));
app.get("/history", (req, res) => res.sendFile(path.join(__dirname, "../frontend/history.html")));
app.get("/send", (req, res) => res.sendFile(path.join(__dirname, "../frontend/send.html")));
app.get("/stake", (req, res) => res.sendFile(path.join(__dirname, "../frontend/stake.html")));
app.get("/trade", (req, res) => res.sendFile(path.join(__dirname, "../frontend/trade.html")));

// Login endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (db[username] && db[username].password === password) {
    res.json({ success: true, redirect: "/home" });
  } else {
    res.json({ success: false, message: "Invalid credentials." });
  }
});

// Signup endpoint
app.post("/signup", (req, res) => {
  const { username, password } = req.body;
  if (!db[username]) {
    db[username] = { password, balance: 500, transactions: [] }; // Default balance
    saveDB();
    res.json({ success: true, redirect: "/home" });
  } else {
    res.json({ success: false, message: "User already exists." });
  }
});

// Fetch balance
app.get("/balance", (req, res) => {
  const { username } = req.query;
  if (db[username]) {
    res.json({ balance: db[username].balance });
  } else {
    res.json({ balance: 0 });
  }
});

// Send tokens
app.post("/send", (req, res) => {
  const { sender, recipient, amount } = req.body;
  if (db[sender] && db[recipient] && db[sender].balance >= amount) {
    db[sender].balance -= amount;
    db[recipient].balance += amount;
    db[sender].transactions.push(`-${amount} to ${recipient}`);
    db[recipient].transactions.push(`+${amount} from ${sender}`);
    saveDB();
    res.json({ success: true });
  } else {
    res.json({ success: false, message: "Transaction failed." });
  }
});

// Fetch transaction history
app.get("/transactions", (req, res) => {
  const { username } = req.query;
  if (!db[username]) {
    res.json({ success: false, message: "User not found." });
  } else {
    res.json({ success: true, transactions: db[username].transactions });
  }
});

// Stake route
app.post("/stake", (req, res) => {
  const { username, amount } = req.body;
  if (db[username] && db[username].balance >= amount) {
    db[username].balance -= amount;
    db[username].transactions.push(`Staked ${amount}`);
    saveDB();
    res.json({ success: true });
  } else {
    res.json({ success: false, message: "Insufficient balance." });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));