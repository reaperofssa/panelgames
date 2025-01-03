const express = require("express");
const fs = require("fs");
const app = express();
const PORT = 3000;

require("./telegrambot");

app.use(express.json());

const dbFile = "./db.json";
let db = JSON.parse(fs.readFileSync(dbFile));

// Helper to save to file
const saveDB = () => fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));

// Login endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (db[username] && db[username].password === password) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: "Invalid credentials." });
  }
});

// Signup endpoint
app.post("/signup", (req, res) => {
  const { username, password } = req.body;
  if (!db[username]) {
    db[username] = { password, balance: 500, transactions: [] }; // Default balance set to 500
    saveDB();
    res.json({ success: true });
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

// Shop items
const shopItems = {
  "3gb2weeks": { price: 3000, description: "Panel 3GB - 2 Weeks" },
  "1gb3weeks": { price: 1500, description: "Panel 1GB - 3 Weeks" },
  "3gb1week": { price: 1700, description: "Panel 3GB - 1 Week" },
};

// Handle shop purchases
app.post("/buy", (req, res) => {
  const { username, item } = req.body;

  if (!db[username]) return res.json({ success: false, message: "User not found." });
  if (!shopItems[item]) return res.json({ success: false, message: "Invalid item." });

  const itemDetails = shopItems[item];
  const userBalance = db[username].balance;

  if (userBalance >= itemDetails.price) {
    db[username].balance -= itemDetails.price;

    // Add shop data to shop.json
    const shopData = JSON.parse(fs.readFileSync("./shop.json"));
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

// Cashout route
app.post("/cashout", (req, res) => {
  const { username, newBalance } = req.body;

  if (!db[username]) {
    return res.json({ success: false, message: "User not found." });
  }

  db[username].balance = newBalance; // Update the user's balance
  saveDB(); // Save changes to the database
  res.json({ success: true });
});

// Fetch transaction history
app.get("/transactions", (req, res) => {
  const { username } = req.query;

  if (!db[username]) {
    return res.json({ success: false, message: "User not found." });
  }

  res.json({ success: true, transactions: db[username].transactions });
});

// Stake route
app.post("/stake", (req, res) => {
  const { username, newBalance } = req.body;

  if (!db[username]) {
    return res.json({ success: false, message: "User not found." });
  }

  db[username].balance = newBalance; // Update the user's balance
  saveDB(); // Save changes to the database
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
