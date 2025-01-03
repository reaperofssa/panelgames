document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("currentUser");

  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }

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
          alert(data.message);
          if (data.success) {
            // Update balance display after successful purchase
            fetch(`/balance?username=${currentUser}`)
              .then(res => res.json())
              .then(balanceData => {
                document.getElementById("balance").textContent = balanceData.balance.toFixed(2);
              });
          }
        });
    });
  });

  document.getElementById("back-btn").addEventListener("click", () => {
    window.location.href = "home.html";
  });
});
