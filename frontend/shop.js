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
          if (data.success) {
            alert(data.message);
          } else {
            alert(data.message);
          }
        });
    });
  });

  document.getElementById("back-btn").addEventListener("click", () => {
    window.location.href = "home.html";
  });
});
