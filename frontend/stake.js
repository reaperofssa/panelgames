document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("currentUser");

  if (!currentUser) {
    alert("User not logged in.");
    window.location.href = "index.html";
    return;
  }

  const balanceDisplay = document.getElementById("balance");
  const stakeAmountInput = document.getElementById("stake-amount");
  const stakeBtn = document.getElementById("stake-btn");
  const backBtn = document.getElementById("back-btn");

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

  // Stake tokens
  const placeStake = async () => {
    const amount = parseFloat(stakeAmountInput.value);

    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid stake amount.");
      return;
    }

    try {
      const response = await fetch("/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser, amount }),
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        balanceDisplay.textContent = data.newBalance.toFixed(2);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error placing stake:", error);
      alert("Failed to place stake.");
    }
  };

  // Event listeners
  stakeBtn.addEventListener("click", placeStake);
  backBtn.addEventListener("click", () => {
    window.location.href = "home";
  });

  fetchBalance(); // Initial fetch of user's balance
});
