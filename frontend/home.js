document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("currentUser");

  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }

  // Display the current username
  document.getElementById("user-display").textContent = currentUser;

  // Fetch and display user balance
  fetch(`/balance?username=${currentUser}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("balance").textContent = data.balance;
    });

  // Navigate to Send Tokens page
  document.getElementById("send-btn").addEventListener("click", () => {
    window.location.href = "send.html";
  });

  // Navigate to Trade page
  document.getElementById("trade-btn").addEventListener("click", () => {
    window.location.href = "trade.html";
  });

  // Navigate to Stake page
  document.getElementById("stake-btn").addEventListener("click", () => {
    window.location.href = "stake.html";
  });

  // Navigate to Shop page
  document.getElementById("shop-btn").addEventListener("click", () => {
    window.location.href = "shop.html";
  });

  // Navigate to Transaction History page
  document.getElementById("history-btn").addEventListener("click", () => {
    window.location.href = "history.html";
  });
});
