document.getElementById("send-token-btn").addEventListener("click", () => {
  const recipient = document.getElementById("recipient").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const currentUser = localStorage.getItem("currentUser");

  // Validate recipient and amount
  if (!recipient || isNaN(amount) || amount <= 0) {
    alert("Please enter valid details.");
    return;
  }

  // Check for minimum transfer amount
  if (amount < 2000) {
    alert("The minimum transfer amount is 2000 tokens.");
    return;
  }

  // Proceed with transfer
  fetch("/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sender: currentUser, recipient, amount }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        alert("Transaction successful!");
        window.location.reload(); // Refresh balance display
      } else {
        alert(data.message);
      }
    })
    .catch((error) => {
      console.error("Error processing transaction:", error);
      alert("An error occurred. Please try again.");
    });
});

// Back button functionality
document.getElementById("back-btn").addEventListener("click", () => {
  window.location.href = "home";
});
