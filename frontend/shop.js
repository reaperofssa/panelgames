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
      const data = await response.json();
      balanceDisplay.textContent = data.balance.toFixed(2);
    } catch (error) {
      console.error("Error fetching balance:", error);
      alert("Failed to fetch balance.");
    }
  };

  // Attach click event to all "buy" buttons
  document.querySelectorAll(".buy-btn").forEach(button => {
    button.addEventListener("click", async () => {
      const item = button.getAttribute("data-item");

      try {
        // Send purchase request
        const response = await fetch("/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: currentUser, item }),
        });
        const data = await response.json();

        if (data.success) {
          // Fetch username and password from shop.json
          const shopResponse = await fetch(`/shop/${currentUser}`);
          const shopData = await shopResponse.json();

          // Display purchase details
          purchaseDetails.innerHTML = `
            <p><strong>Purchase Successful!</strong></p>
            <p>Item: ${item}</p>
            <p>Username: ${shopData.username}</p>
            <p>Password: ${shopData.password}</p>
            <p>Panel Link: <a href="${shopData.link}" target="_blank">${shopData.link}</a></p>
          `;
          purchaseDetails.style.display = "block";

          // Update the balance display
          fetchBalance();
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

  // Fetch initial balance
  fetchBalance();
});
