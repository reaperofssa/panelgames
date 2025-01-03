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

  let currentBalance = 0;

  // Fetch and display user's balance
  const fetchBalance = async () => {
    const response = await fetch(`/balance?username=${currentUser}`);
    const data = await response.json();
    currentBalance = data.balance;
    balanceDisplay.textContent = currentBalance.toFixed(2);
  };

  // Stake tokens
  const stakeTokens = async () => {
    const stakeAmount = parseFloat(stakeAmountInput.value);

    if (isNaN(stakeAmount) || stakeAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (stakeAmount > currentBalance) {
      alert("Insufficient balance to stake this amount.");
      return;
    }

    // Simulate staking outcome
    const won = Math.random() < 0.5; // 50% chance to win
    const newBalance = won ? currentBalance + stakeAmount : currentBalance - stakeAmount;

    // Update balance immediately on the frontend
    currentBalance = newBalance;
    balanceDisplay.textContent = currentBalance.toFixed(2);

    // Send updated balance to the server
    const response = await fetch("/stake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUser, newBalance }),
    });

    const data = await response.json();
    if (data.success) {
      alert(won ? `Congratulations! You won ${stakeAmount * 2} tokens.` : "You lost the staked amount.");
    } else {
      alert("An error occurred while updating your balance.");
    }
  };

  // Event listeners
  document.addEventListener("DOMContentLoaded", fetchBalance);
  stakeBtn.addEventListener("click", stakeTokens);
  backBtn.addEventListener("click", () => {
    window.location.href = "home.html";
  });
});
