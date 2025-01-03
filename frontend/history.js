document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("currentUser");

  if (!currentUser) {
    alert("User not logged in.");
    window.location.href = "index.html";
    return;
  }

  // Fetch and display the user's transaction history
  const fetchTransactions = async () => {
    const response = await fetch(`/transactions?username=${currentUser}`);
    const data = await response.json();

    const transactionList = document.getElementById("transaction-list");
    transactionList.innerHTML = ""; // Clear existing content

    if (data.transactions && data.transactions.length > 0) {
      data.transactions.forEach(transaction => {
        const listItem = document.createElement("li");
        listItem.textContent = transaction;
        transactionList.appendChild(listItem);
      });
    } else {
      transactionList.textContent = "No transactions found.";
    }
  };

  // Fetch transactions on page load
  fetchTransactions();

  // Back button functionality
  document.getElementById("back-btn").addEventListener("click", () => {
    window.location.href = "home.html";
  });
});
