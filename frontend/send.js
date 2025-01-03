document.getElementById("send-token-btn").addEventListener("click", () => {
  const recipient = document.getElementById("recipient").value;
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
    .then(res => res.json())
    .then(data => {
      if (data.success) alert("Transaction successful!");
      else alert(data.message);
    });
});

// Back button functionality
document.getElementById("back-btn").addEventListener("click", () => {
  window.location.href = "home";
});
