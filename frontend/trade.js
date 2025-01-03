document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("currentUser");

  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }

  // Attach click event to all "buy" buttons
  document.querySelectorAll(".buy-btn").forEach(button => {
    button.addEventListener("click", () => {
      const item = button.getAttribute("data-item");

      fetch("/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser, item }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // Display purchase details
            const { message } = data;
            alert(message);

            // Update the balance display
            fetch(`/balance?username=${currentUser}`)
              .then(res => res.json())
              .then(balanceData => {
                document.getElementById("balance").textContent = balanceData.balance.toFixed(2);
              });

            // Update purchase confirmation details
            const purchaseDetails = document.getElementById("purchase-details");
            purchaseDetails.innerHTML = `
              <p><strong>Purchase Successful!</strong></p>
              <p>Username: ${currentUser}</p>
              <p>Password: Hidden for security</p>
              <p>Panel Link: <a href="https://panel.navocloud.com" target="_blank">https://panel.navocloud.com</a></p>
            `;
            purchaseDetails.style.display = "block";
          } else {
            alert(data.message);
          }
        })
        .catch(err => {
          console.error("Error processing purchase:", err);
          alert("An error occurred. Please try again.");
        });
    });
  });

  // Handle "Back" button
  document.getElementById("back-btn").addEventListener("click", () => {
    window.location.href = "home";
  });
});
