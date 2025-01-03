document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("currentUser");

  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }

  const balanceDisplay = document.getElementById("balance");
  const purchaseDetails = document.getElementById("purchase-details");

  // Fetch and display user's balance
  const fetchBalance = async () => {
    try {
      const response = await fetch(`/balance?username=${currentUser}`);
      if (!response.ok) {
        throw new Error("Failed to fetch balance.");
      }
      const data = await response.json();
      balanceDisplay.textContent = data.balance.toFixed(2);
    } catch (error) {
      console.error("Error fetching balance:", error);
      alert("Failed to fetch balance.");
    }
  };

  // Initial balance fetch
  fetchBalance();

  // Attach click event to all "buy" buttons
  document.querySelectorAll(".buy-btn").forEach(button => {
    button.addEventListener("click", async () => {
      const item = button.getAttribute("data-item");

      try {
        const response = await fetch("/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: currentUser, item }),
        });

        const data = await response.json();
        if (data.success) {
          // Display success message in an alert
          alert(data.message);

          // Update the balance display
          await fetchBalance();

          // Update purchase confirmation details with data from the server
          const { item } = data;
          purchaseDetails.innerHTML = `
            <p><strong>Purchase Successful!</strong></p>
            <p>Item: ${item.item}</p>
            <p>Username: ${item.username}</p>
            <p>Password: ${item.password}</p>
            <p>Panel Link: <a href="${item.link}" target="_blank">${item.link}</a></p>
            <p>Please screenshot this page for your records.</p>
          `;
          purchaseDetails.style.display = "block";
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error("Error processing purchase:", error);
        alert("An error occurred. Please try again.");
      }
    });
  });

  // Handle "Back" button
  document.getElementById("back-btn").addEventListener("click", () => {
    window.location.href = "home";
  });
});
