document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("currentUser");

  if (!currentUser) {
    alert("User not logged in.");
    window.location.href = "index.html";
    return;
  }

  let userBalance = 0;
  let tradingInterval = null;
  let isTrading = false;

  const balanceDisplay = document.getElementById("balance");
  const tradeBtn = document.getElementById("trade-btn");
  const cashoutBtn = document.getElementById("cashout-btn");
  const backBtn = document.getElementById("back-btn");

  // Fetch and display user balance
  const fetchBalance = async () => {
    try {
      const response = await fetch(`/balance?username=${currentUser}`);
      const data = await response.json();
      balanceDisplay.textContent = data.balance.toFixed(2);
    } catch (error) {
      console.error("Error fetching balance:", error);
      alert("Failed to fetch balance.");
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

      // Save the updated balance to the server
      fetch("/update-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser,
          balance: userBalance,
          tradeAction: "update",
        }),
      }).catch((err) => console.error("Error updating trade balance:", err));
    }, 1000); // Update every second
  };

  // Cash out and finalize trading session
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
        await fetchBalance(); // Refresh balance after cashout
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
    window.location.href = "home";
  };

  // Event listeners
  tradeBtn.addEventListener("click", startTrading);
  cashoutBtn.addEventListener("click", cashout);
  backBtn.addEventListener("click", backToHome);

  fetchBalance(); // Initial fetch of user's balance
});
