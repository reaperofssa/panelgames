document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("currentUser");

  if (!currentUser) {
    alert("User not logged in.");
    window.location.href = "index.html";
    return;
  }

  const balanceDisplay = document.getElementById("balance");
  const stakeAmountInput = document.getElementById("stake-amount");
  const stakeBtn = document.getElementById("stake-btn");
  const cashoutBtn = document.getElementById("cashout-btn");
  const backBtn = document.getElementById("back-btn");
  const plane = document.getElementById("plane");
  const multiplierDisplay = document.getElementById("multiplier");

  let balance = 0;
  let multiplier = 1.0;
  let crashPoint = 0;
  let stakeAmount = 0;
  let gameId = null;
  let isRunning = false;

  // Audio for game
  const gameMusic = new Audio("https://files.catbox.moe/leh52a.mp3"); // Replace with your music file
  gameMusic.loop = true;

  // Fetch and display user's balance
  const fetchBalance = async () => {
    try {
      const response = await fetch(`/balance?username=${currentUser}`);
      const data = await response.json();
      if (data.success) {
        balance = data.balance || 0; // Prevent undefined balance
        balanceDisplay.textContent = balance.toFixed(2);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      alert("Failed to fetch balance.");
    }
  };

  // Start the game
  const startGame = async () => {
    stakeAmount = parseFloat(stakeAmountInput.value);

    if (isNaN(stakeAmount) || stakeAmount <= 0 || stakeAmount > balance) {
      alert("Invalid stake amount.");
      return;
    }

    try {
      const response = await fetch("/avstake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser, amount: stakeAmount }),
      });

      const data = await response.json();
      if (data.success) {
        balance = data.newBalance || balance; // Update balance to ensure synchronization
        balanceDisplay.textContent = balance.toFixed(2);
        crashPoint = data.crashPoint;
        gameId = data.gameId;
        multiplier = 1.0;
        isRunning = true;

        cashoutBtn.disabled = false;
        stakeBtn.disabled = true;

        // Start game music
        gameMusic.play();

        // Start animation loop
        animateGame();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error starting game:", error);
      alert("Failed to start game.");
    }
  };

  // Game animation loop
  const animateGame = () => {
    if (!isRunning) return;

    multiplier += 0.01; // Increment multiplier
    multiplierDisplay.textContent = multiplier.toFixed(2) + "x";

    // Move the plane
    plane.style.transform = `translateX(${multiplier * 20}px)`;

    if (multiplier >= crashPoint) {
      isRunning = false;
      gameMusic.pause();
      gameMusic.currentTime = 0; // Reset music
      alert("Plane crashed! You lost your stake.");
      resetGame();
      return;
    }

    // Continue animation
    requestAnimationFrame(animateGame);
  };

  // Cash out before crash
  const cashout = async () => {
    isRunning = false;
    gameMusic.pause();
    gameMusic.currentTime = 0; // Reset music

    try {
      const response = await fetch("/avcashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser, gameId, multiplier }),
      });

      const data = await response.json();
      if (data.success) {
        balance = data.newBalance || balance; // Ensure balance is updated
        balanceDisplay.textContent = balance.toFixed(2);

        alert(
          `You cashed out at ${multiplier.toFixed(2)}x. Winnings: ${data.winnings.toFixed(
            2
          )}`
        );
        resetGame();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error during cashout:", error);
      alert("Failed to cash out.");
    }
  };

  // Reset game state
  const resetGame = () => {
    multiplierDisplay.textContent = "1.0x";
    plane.style.transform = "translateX(0px)";
    cashoutBtn.disabled = true;
    stakeBtn.disabled = false;
    fetchBalance();
  };

  // Event listeners
  stakeBtn.addEventListener("click", startGame);
  cashoutBtn.addEventListener("click", cashout);
  backBtn.addEventListener("click", () => {
    window.location.href = "home";
  });

  // Initial balance fetch
  fetchBalance();
});
