document.getElementById("login-btn").addEventListener("click", () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
  
    if (username && password) {
      localStorage.setItem("currentUser", username);
      fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            window.location.href = data.redirect;
          } else {
            alert(data.message);
          }
        });
    } else {
      alert("Please fill in all fields.");
    }
  });
  
  document.getElementById("signup-btn").addEventListener("click", () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
  
    if (username && password) {
      fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            window.location.href = data.redirect;
          } else {
            alert(data.message);
          }
        });
    } else {
      alert("Please fill in all fields.");
    }
  });