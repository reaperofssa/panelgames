const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const createBot = require("./telegrambot");
createBot();

const tradesDir = "./trades";

if (!fs.existsSync(tradesDir)) {
  fs.mkdirSync(tradesDir);
}

const dbFile = path.join(__dirname, "db.json");
let db = JSON.parse(fs.readFileSync(dbFile));

// Helper to save database to file
const saveDB = () => fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));

const dbPath = "db.json";
const loadDB = () => {
  try {
    return JSON.parse(fs.readFileSync(dbPath, "utf8"));
  } catch (error) {
    console.error("Error reading db.json:", error);
    throw new Error("Internal server error.");
  }
};

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
app.get("/index.html", (req, res) => res.sendFile(path.join(__dirname, "../frontend/index.html")));

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

  // Load shop data
  const shopDataPath = "./shop.json";
  const shopData = fs.existsSync(shopDataPath) 
    ? JSON.parse(fs.readFileSync(shopDataPath)) 
    : [];

  // Check if the item is available in the shop
  const availableItemIndex = shopData.findIndex(shopItem => shopItem.item === itemDetails.description);
  if (availableItemIndex === -1) {
    return res.json({ success: false, message: "Item is no longer available. Please check back later." });
  }

  // Check if user has enough balance
  if (userBalance < itemDetails.price) {
    return res.json({ success: false, message: "Insufficient balance." });
  }

  // Deduct balance and assign the item
  db[username].balance -= itemDetails.price;
  const purchasedItem = shopData.splice(availableItemIndex, 1)[0]; // Remove the item
  fs.writeFileSync(shopDataPath, JSON.stringify(shopData, null, 2)); // Save updated shop data

  // Save the updated user balance
  saveDB();

  // Construct the success message with the required details
  const successMessage = `Purchase of ${itemDetails.description} successful!\n\nUsername: ${username}\nPassword: ${db[username].password}\nLink: https://panel.navocloud.com`;

  res.json({
    success: true,
    message: successMessage,  // Send the constructed message
    item: purchasedItem,
    updatedShopData: shopData // Send the updated shop data back
  });
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

app.get("/transactions", (req, res) => {
  const { username } = req.query;

  // Validate the username
  if (!username) {
    return res.status(400).json({ success: false, message: "Username is required." });
  }

  // Load user data from db.json
  let db;
  try {
    db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  } catch (error) {
    console.error("Error reading db.json:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }

  // Check if the user exists
  const user = db[username];
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  // Return the user's transactions
  const transactions = user.transactions || [];
  return res.json({ success: true, transactions });
});

// Stake route
app.post("/stake", (req, res) => {
  const { username, amount } = req.body;

  if (!db[username]) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  if (amount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid stake amount." });
  }

  if (db[username].balance < amount) {
    return res.status(400).json({ success: false, message: "Insufficient balance." });
  }

  const won = Math.random() < 0.5; // 50% chance to win
  const stakeResult = won ? amount : -amount;

  // Update user's balance and log transaction
  db[username].balance += stakeResult;
  db[username].transactions.push({
    type: "stake",
    amount,
    outcome: won ? "won" : "lost",
    result: stakeResult,
    timestamp: new Date().toISOString(),
  });

  saveDB();

  res.json({
    success: true,
    newBalance: db[username].balance,
    message: won
      ? `Congratulations! You won ${amount} tokens.`
      : `You lost ${amount} tokens.`,
  });
});

// Start trade session and return user balance
app.get("/trade", (req, res) => {
app.get("/trade", (req, res) => {
  const { username } = req.query;

  // Validate username
  if (!username) {
    return res.status(400).json({ success: false, message: "Username is required." });
  }

  let db;
  try {
    db = loadDB();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }

  // Check if user exists
  const user = db[username];
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  // Return balance and start trade session message
  const userBalance = user.balance || 0;
  return res.json({
    success: true,
    balance: userBalance,
    message: "Trade session started.",
  });
});

// Update trade balance during trading
app.post("/update-trade", (req, res) => {
  const { username, amount, tradeAction } = req.body;

  if (!username || amount === undefined || !tradeAction) {
    return res.status(400).json({ success: false, message: "Invalid request. Provide username, amount, and tradeAction." });
  }

  if (!db[username]) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const userBalance = db[username].balance || 0;

  if (tradeAction === "update") {
    if (amount < 0) {
      return res.status(400).json({ success: false, message: "Invalid amount. Cannot be negative." });
    }

    db[username].balance = amount;
  } else {
    return res.status(400).json({ success: false, message: "Invalid trade action. Use 'update'." });
  }

  // Log the transaction
  db[username].transactions.push({
    type: "trade",
    tradeAction,
    amount,
    newBalance: db[username].balance,
    timestamp: new Date().toISOString(),
  });

  saveDB();

  res.json({
    success: true,
    newBalance: db[username].balance,
    message: `Trade balance updated to ${amount} successfully.`,
  });
});

// Cashout and return the updated balance
app.post("/cashout", (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, message: "Username is required." });
  }

  if (!db[username]) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const userBalance = db[username].balance || 0;

  // Log the cashout
  db[username].transactions.push({
    type: "cashout",
    amount: userBalance,
    newBalance: userBalance,
    timestamp: new Date().toISOString(),
  });

  saveDB();

  res.json({
    success: true,
    message: "Cashout successful!",
    balance: userBalance,
  });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
