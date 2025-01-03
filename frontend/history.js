document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("currentUser");

  if (!currentUser) {
    alert("User not logged in.");
    window.location.href = "index.html";
    return;
  }

  // Fetch and display the user's transaction history
  const fetchTransactions = async () => {
    try {
      const response = await fetch("/transactions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Username": currentUser, // Pass username as a header
        },
      });

      const data = await response.json();

      const transactionList = document.getElementById("transaction-list");
      transactionList.innerHTML = ""; // Clear existing content

      if (data.success && data.transactions && data.transactions.length > 0) {
        data.transactions.forEach((transaction) => {
          const listItem = document.createElement("li");

          // Display transaction details dynamically
          listItem.textContent = transaction.type
            ? `${transaction.type.toUpperCase()} - ${
                transaction.amount
              } tokens ${
                transaction.sender ? `from ${transaction.sender}` : `to ${transaction.recipient}`
              } on ${new Date(transaction.timestamp).toLocaleString()}`
            : JSON.stringify(transaction); // Fallback for unexpected formats

          transactionList.appendChild(listItem);
        });
      } else {
        transactionList.textContent = "No transactions found.";
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      document.getElementById("transaction-list").textContent =
        "Error loading transactions. Please try again later.";
    }
  };

  // Fetch transactions on page load
  fetchTransactions();

  // Back button functionality
  document.getElementById("back-btn").addEventListener("click", () => {
    window.location.href = "home";
  });
});
