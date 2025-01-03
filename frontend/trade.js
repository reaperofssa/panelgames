let currentUser = localStorage.getItem("currentUser");
let tradeBalance = 0; // Tracks the balance during trading
let tradingInterval = null; // Interval for random trading changes
let isTrading = false;

const balanceDisplay = document.getElementById("balance");
const tradeBtn = document.getElementById("trade-btn");
const cashoutBtn = document.getElementById("cashout-btn");
const backBtn = document.getElementById("back-btn");

// Fetch and display user's current balance
const fetchBalance = async () => {
  if (!currentUser) {
    alert("User not logged in.");
    window.location.href = "index.html";
    return;
  }

  const response = await fetch(`/balance?username=${currentUser}`);
  const data = await response.json();
  tradeBalance = data.balance;
  balanceDisplay.textContent = tradeBalance.toFixed(2);
};

// Start trading: Randomly adjust balance
const startTrading = () => {
  if (isTrading) return;

  isTrading = true;
  cashoutBtn.disabled = false;

  tradingInterval = setInterval(() => {
    const randomChange = (Math.random() * 2 - 1) * 0.12; // Random change between -0.12 and +0.12
    tradeBalance += tradeBalance * randomChange;
    balanceDisplay.textContent = tradeBalance.toFixed(2);
  }, 1000); // Update every second
};

// Stop trading and cash out
const cashout = async () => {
  if (!isTrading) return;

  clearInterval(tradingInterval);
  isTrading = false;
  cashoutBtn.disabled = true;

  const response = await fetch("/cashout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: currentUser, newBalance: tradeBalance }),
  });

  const data = await response.json();
  if (data.success) {
    alert("Cashout successful! Your new balance is updated.");
    tradeBalance = 0;
    await fetchBalance();
  } else {
    alert("Cashout failed.");
  }
};

// Handle navigation back to home
const backToHome = () => {
  window.location.href = "home.html";
};

// Event listeners
document.addEventListener("DOMContentLoaded", fetchBalance);
tradeBtn.addEventListener("click", startTrading);
cashoutBtn.addEventListener("click", cashout);
backBtn.addEventListener("click", backToHome);
