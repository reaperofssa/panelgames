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
      const response = await fetch(`/transactions?username=${currentUser}`);
      const data = await response.json();

      const transactionList = document.getElementById("transaction-list");
      transactionList.innerHTML = ""; // Clear existing content

      if (data.success && data.transactions && data.transactions.length > 0) {
        data.transactions.forEach(transaction => {
          const listItem = document.createElement("li");
          
          // Display transaction details dynamically
          if (typeof transaction === "string") {
            listItem.textContent = transaction; // For string-based transactions
          } else if (transaction.type) {
            // For object-based transactions with type
            listItem.textContent = `${transaction.type.toUpperCase()} - ${
              transaction.amount
            } tokens ${transaction.sender ? `from ${transaction.sender}` : `to ${transaction.recipient}`} on ${
              new Date(transaction.timestamp).toLocaleString()
            }`;
          } else {
            listItem.textContent = JSON.stringify(transaction); // Fallback for unexpected formats
          }

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
    window.location.href = "home.html";
  });
});
