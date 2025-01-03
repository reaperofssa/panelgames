let currentUser = localStorage.getItem("currentUser");
let userBalance = 0;
let tradingInterval = null;
let isTrading = false;

const balanceDisplay = document.getElementById("balance");
const tradeBtn = document.getElementById("trade-btn");
const cashoutBtn = document.getElementById("cashout-btn");
const backBtn = document.getElementById("back-btn");

// Fetch and display initial trade balance
const fetchTradeBalance = async () => {
  if (!currentUser) {
    alert("User not logged in.");
    window.location.href = "index.html";
    return;
  }

  try {
    const response = await fetch(`/trade?username=${currentUser}`);
    const data = await response.json();

    if (data.success) {
      userBalance = 0; // Reset displayed balance to 0
      balanceDisplay.textContent = userBalance.toFixed(2);
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error("Error fetching trade balance:", error);
    alert("Failed to fetch trade balance.");
  }
};

// Start trading and update balance periodically
const startTrading = () => {
  if (isTrading) return;

  isTrading = true;
  cashoutBtn.disabled = false;

  tradingInterval = setInterval(() => {
    const randomChange = (Math.random() * 2 - 1) * 0.12; // Random change between -0.12 and +0.12
    userBalance += userBalance * randomChange;

    balanceDisplay.textContent = userBalance.toFixed(2);

    // Save the ongoing trade balance to the server
    fetch("/update-trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUser, tradeBalance: userBalance }),
    }).catch((err) => console.error("Error updating trade balance:", err));
  }, 1000); // Update every second
};

// Cash out and push balance to main account
const cashout = async () => {
  if (!isTrading) return;

  clearInterval(tradingInterval);
  isTrading = false;
  cashoutBtn.disabled = true;

  try {
    const response = await fetch("/cashout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUser }),
    });

    const data = await response.json();
    if (data.success) {
      alert(data.message);
      await fetchTradeBalance(); // Refresh balance after cashout
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error("Error during cashout:", error);
    alert("An error occurred while cashing out.");
  }
};

// Handle navigation back to home
const backToHome = () => {
  window.location.href = "home.html";
};

// Event listeners
document.addEventListener("DOMContentLoaded", fetchTradeBalance);
tradeBtn.addEventListener("click", startTrading);
cashoutBtn.addEventListener("click", cashout);
backBtn.addEventListener("click", backToHome);
