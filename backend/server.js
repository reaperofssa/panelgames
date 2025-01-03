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

// Purchase route
const shopItems = {
  "3gb2weeks": { price: 3000, description: "Panel 3GB - 2 Weeks" },
  "1gb3weeks": { price: 1500, description: "Panel 1GB - 3 Weeks" },
  "3gb1week": { price: 1700, description: "Panel 3GB - 1 Week" },
};

app.post("/buy", (req, res) => {
  const { username, item } = req.body;

  if (!db[username]) {
    return res.json({ success: false, message: "User not found." });
  }

  if (!shopItems[item]) {
    return res.json({ success: false, message: "Invalid item." });
  }

  const itemDetails = shopItems[item];
  const userBalance = db[username].balance;

  if (userBalance >= itemDetails.price) {
    db[username].balance -= itemDetails.price;

    const shopData = fs.existsSync("./shop.json")
      ? JSON.parse(fs.readFileSync("./shop.json"))
      : [];

    shopData.push({
      username,
      password: db[username].password,
      link: "https://panel.navocloud.com",
      item: itemDetails.description,
    });

    fs.writeFileSync("./shop.json", JSON.stringify(shopData, null, 2));
    saveDB();

    res.json({ success: true, message: `Purchase of ${itemDetails.description} successful.` });
  } else {
    res.json({ success: false, message: "Insufficient balance." });
  }
});

// Send tokens
app.post("/send", (req, res) => {
  const { sender, recipient, amount } = req.body;

  if (!db[sender]) {
    return res.status(404).json({ success: false, message: "Sender not found." });
  }

  if (!db[recipient]) {
    return res.status(404).json({ success: false, message: "Recipient not found." });
  }

  if (db[sender].balance < amount) {
    return res.status(400).json({ success: false, message: "Insufficient balance." });
  }

  db[sender].balance -= amount;
  db[recipient].balance += amount;

  const transaction = {
    type: "transfer",
    sender,
    recipient,
    amount,
    timestamp: new Date().toISOString(),
  };

  if (!db[sender].transactions) db[sender].transactions = [];
  db[sender].transactions.push({
    type: "sent",
    recipient,
    amount,
    timestamp: transaction.timestamp,
  });

  if (!db[recipient].transactions) db[recipient].transactions = [];
  db[recipient].transactions.push({
    type: "received",
    sender,
    amount,
    timestamp: transaction.timestamp,
  });

  saveDB();

  res.json({ success: true, message: "Transaction successful." });
});

// Stake route
app.post("/stake", (req, res) => {
  const { username, amount } = req.body;

  if (!db[username]) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  if (db[username].balance < amount) {
    return res.status(400).json({ success: false, message: "Insufficient balance." });
  }

  const won = Math.random() < 0.5; // 50% chance to win
  const stakeResult = won ? amount : -amount;

  db[username].balance += stakeResult;
  db[username].transactions.push(`Staked ${amount}: ${won ? "Won" : "Lost"} ${Math.abs(stakeResult)}`);

  saveDB();

  res.json({
    success: true,
    newBalance: db[username].balance,
    message: won ? `Congratulations! You won ${amount * 2} tokens.` : "You lost the staked amount.",
  });
});

// Trade balance
const tradeFilesDir = path.join(__dirname, "trades");
if (!fs.existsSync(tradeFilesDir)) fs.mkdirSync(tradeFilesDir);

app.get("/trade", (req, res) => {
  const { username } = req.query;
  const tradeFile = path.join(tradeFilesDir, `${username}_trade.json`);

  if (!fs.existsSync(tradeFile)) {
    const initialTradeData = { balance: db[username]?.balance || 0 };
    fs.writeFileSync(tradeFile, JSON.stringify(initialTradeData, null, 2));
  }

  const tradeData = JSON.parse(fs.readFileSync(tradeFile));
  res.json(tradeData);
});

// Cashout
app.post("/cashout", (req, res) => {
  const { username, newBalance } = req.body;
  const tradeFile = path.join(tradeFilesDir, `${username}_trade.json`);

  if (!db[username]) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  if (!fs.existsSync(tradeFile)) {
    return res.status(400).json({ success: false, message: "Trade file not found." });
  }

  db[username].balance = newBalance;
  fs.writeFileSync(tradeFile, JSON.stringify({ balance: newBalance }, null, 2));
  saveDB();

  res.json({ success: true, message: "Cashout successful.", balance: db[username].balance });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
