document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("currentUser");

  if (!currentUser) {
    alert("User not logged in.");
    window.location.href = "index.html";
    return;
  }

  const balanceDisplay = document.getElementById("balance");
  const tradeBtn = document.getElementById("trade-btn");
  const cashoutBtn = document.getElementById("cashout-btn");
  const backBtn = document.getElementById("back-btn");
  const errorMessage = document.getElementById("error-message");
  const loadingIndicator = document.getElementById("loading-indicator");

  let tradeInterval;

  // Fetch and display user's balance
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

  // Start trading
  const startTrade = async () => {
    errorMessage.classList.add("hidden");
    loadingIndicator.classList.remove("hidden");

    try {
      const response = await fetch("/trade/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser }),
      });

      const data = await response.json();
      loadingIndicator.classList.add("hidden");

      if (data.success) {
        tradeBtn.disabled = true;
        cashoutBtn.disabled = false;

        // Start live balance updates
        tradeInterval = setInterval(fetchBalance, 1000);
      } else {
        errorMessage.textContent = data.message;
        errorMessage.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Error starting trade:", error);
      alert("Failed to start trade.");
      loadingIndicator.classList.add("hidden");
    }
  };

  // Cash out trade
  const cashoutTrade = async () => {
    try {
      const response = await fetch("/trade/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser }),
      });

      const data = await response.json();

      if (data.success) {
        clearInterval(tradeInterval);
        alert(data.message);
        balanceDisplay.textContent = data.newBalance.toFixed(2);
        tradeBtn.disabled = false;
        cashoutBtn.disabled = true;
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error cashing out trade:", error);
      alert("Failed to cash out trade.");
    }
  };

  // Event listeners
  tradeBtn.addEventListener("click", async () => {
    await startTrade();
    tradeBtn.disabled = true;
    cashoutBtn.disabled = false;
  });

  cashoutBtn.addEventListener("click", async () => {
    await cashoutTrade();
    cashoutBtn.disabled = true;
    tradeBtn.disabled = false;
  });

  backBtn.addEventListener("click", () => {
    window.location.href = "home";
  });

  fetchBalance(); // Initial fetch of user's balance
});
