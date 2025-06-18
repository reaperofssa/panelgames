const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

let botInstance = null;
const shopFile = "./shop.json";

// Function to create and initialize the bot
function createBot() {
  if (!botInstance) {
    const token = "7586020555:AAGZL-qgWrPJrvVQ2xBxmnSPICA6yDK8saM"; // Replace with your actual token
    botInstance = new TelegramBot(token, { polling: true });

    // Add bot handlers
    botInstance.onText(/\/start/, (msg) => {
      botInstance.sendMessage(msg.chat.id, "Welcome to the bot!");
    });

    // Handle shop commands
    botInstance.onText(/\/3gb2weeks (.+)/, (msg, match) => {
      handleShopCommand(msg, match[1], "Panel 3GB - 2 Weeks");
    });

    botInstance.onText(/\/3gb1week (.+)/, (msg, match) => {
      handleShopCommand(msg, match[1], "Panel 3GB - 1 Week");
    });

    botInstance.onText(/\/1gb3weeks (.+)/, (msg, match) => {
      handleShopCommand(msg, match[1], "Panel 1GB - 3 Weeks");
    });

    console.log("Telegram bot started...");
  }
  return botInstance;
}

// Function to handle shop commands
function handleShopCommand(msg, credentials, itemDescription) {
  try {
    // Validate input
    const [username, password] = credentials.split(":");
    if (!username || !password) {
      botInstance.sendMessage(
        msg.chat.id,
        "Invalid format. Use: /<command> username:password"
      );
      return;
    }

    // Ensure shop file exists and load data
    let shopData = [];
    if (fs.existsSync(shopFile)) {
      const fileContent = fs.readFileSync(shopFile);
      shopData = JSON.parse(fileContent);
    }

    // Add new item to shop data
    shopData.push({
      username,
      password,
      link: "https://panel.navocloud.com",
      item: itemDescription,
    });

    // Write updated shop data to file
    fs.writeFileSync(shopFile, JSON.stringify(shopData, null, 2));

    // Notify the user of success
    botInstance.sendMessage(
      msg.chat.id,
      `Item successfully added to the shop!\n\nItem: ${itemDescription}\nUsername: ${username}\nPassword: ${password}\nLink: https://panel.navocloud.com`
    );
  } catch (error) {
    console.error("Error updating shop.json:", error);
    botInstance.sendMessage(
      msg.chat.id,
      "An error occurred while processing your request. Please try again."
    );
  }
}

// Export the bot creation function
module.exports = createBot;

// Initialize the bot if running this file directly
if (require.main === module) {
  createBot();
}
