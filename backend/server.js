const express = require("express");
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");

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

const addDailyBonus = () => {
  const db = loadDB();

  Object.keys(db).forEach((username) => {
    if (db[username].balance !== undefined) {
      db[username].balance += 100;
    }
  });

  saveDB(db);
  console.log("Daily bonus added to all users.");
};

// Schedule the task to run every 24 hours
cron.schedule("0 0 * * *", () => {
  console.log("Running daily bonus task...");
  addDailyBonus();
});


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

  // Construct the success message using details from shop.json
  const { username: shopUsername, password, link } = purchasedItem; // Get credentials from shop.json
  const successMessage = `Purchase of ${itemDetails.description} successful!\n\nUsername: ${shopUsername}\nPassword: ${password}\nLink: ${link}\n\nPlease screenshot this page for your records.`;

  res.json({
    success: true,
    message: successMessage, // Send the constructed message
    item: purchasedItem,
    updatedShopData: shopData, // Send the updated shop data back
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

app.get("/shop/:username", (req, res) => {
  const { username } = req.params;

  try {
    const shopData = JSON.parse(fs.readFileSync("shop.json", "utf8"));

    if (!shopData[username]) {
      return res.status(404).json({ success: false, message: "Shop details not found." });
    }

    res.json({
      success: true,
      username: shopData[username].username,
      password: shopData[username].password,
      link: shopData[username].link || "https://panel.navocloud.com",
    });
  } catch (error) {
    console.error("Error reading shop.json:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// Weighted random function for crash point
const generateCrashPoint = () => {
  const weights = [];
  let cumulativeWeight = 0;

  // Define weighted probabilities
  for (let i = 1; i <= 10; i += 0.1) {
    const value = parseFloat(i.toFixed(1));

    // Assign higher weights to 1.0–1.56
    let weight;
    if (value <= 1.56) {
      weight = 5 / value; // High weight for low values
    } else if (value <= 2.5) {
      weight = 2 / value; // Medium weight
    } else {
      weight = 1 / (value * 2); // Low weight for higher values
    }

    cumulativeWeight += weight;
    weights.push({ value, cumulativeWeight });
  }

  // Generate random crash point based on weighted probabilities
  const random = Math.random() * cumulativeWeight;
  return weights.find((w) => random <= w.cumulativeWeight).value;
};

app.post("/avstake", (req, res) => {
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

  // Deduct stake amount
  db[username].balance -= amount;

  // Generate crash point
  const crashPoint = generateCrashPoint();
  const gameId = new Date().getTime(); // Unique game ID

  db[username].transactions.push({
    gameId,
    type: "stake",
    amount,
    outcome: "in-progress",
    crashPoint,
    timestamp: new Date().toISOString(),
  });

  saveDB();

  res.json({
    success: true,
    message: "Game started. Place your cashout before the crash!",
    crashPoint,
    newBalance: db[username].balance,
    gameId,
  });
});

// Endpoint to handle cashout
app.post("/avcashout", (req, res) => {
  const { username, gameId, multiplier } = req.body;

  if (!db[username]) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const transaction = db[username].transactions.find(
    (tx) => tx.gameId === gameId && tx.outcome === "in-progress"
  );

  if (!transaction) {
    return res.status(400).json({ success: false, message: "Invalid game or already cashed out." });
  }

  if (multiplier > transaction.crashPoint) {
    transaction.outcome = "crashed";
    saveDB();
    return res.status(400).json({ success: false, message: "The plane crashed! You lost your stake." });
  }

  // Calculate winnings and update balance
  const winnings = transaction.amount * multiplier;
  db[username].balance += winnings;

  transaction.outcome = "cashed-out";
  transaction.result = winnings;

  saveDB();

  res.json({
    success: true,
    message: `Cashed out successfully at ${multiplier.toFixed(2)}x. You won ${winnings.toFixed(2)} tokens!`,
    newBalance: db[username].balance,
    winnings,
  });
});

app.get("/transactions", (req, res) => {
  // Get the username from headers or query parameters
  const username = req.headers.username || req.query.username;

  // Validate the username
  if (!username) {
    return res.status(400).json({ success: false, message: "Username is required." });
  }

  let db;
  try {
    // Load user data from db.json
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
  res.json({ success: true, transactions });
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

  const won = Math.random() < 0.46; // 47% chance to win
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
let trades = {}; // Store active trades for each user

// Start trading
app.post("/trade/start", (req, res) => {
  const { username } = req.body;

  if (!db[username]) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  if (trades[username]) {
    return res.status(400).json({ success: false, message: "Trade already in progress." });
  }

  trades[username] = {
    interval: setInterval(() => {
      const change = parseFloat((Math.random() * (2.89 - 0.12) + 0.12).toFixed(2));
      const direction = Math.random() < 0.5 ? -1 : 1;
      const update = direction * change;

      db[username].balance += update;
      saveDB();
    }, 1000), // Update every second
  };

  res.json({ success: true, message: "Trade started." });
});

// Cash out trade
app.post("/trade/cashout", (req, res) => {
  const { username } = req.body;

  if (!db[username]) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  const trade = trades[username];

  if (!trade) {
    return res.status(400).json({ success: false, message: "No active trade to cash out." });
  }

  // Stop the trading interval
  clearInterval(trade.interval);
  delete trades[username];

  saveDB();

  res.json({
    success: true,
    newBalance: db[username].balance,
    message: "Trade cashed out successfully.",
  });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
