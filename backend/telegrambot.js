const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const token = "7928488118:AAHwF6bGSJewnSx0XhYvLcjGC1xDLSsJdTw";
const bot = new TelegramBot(token, { polling: true });

const shopFile = "./shop.json";

// Handle commands for different items
bot.onText(/\/3gb2weeks (.+)/, (msg, match) => {
  handleShopCommand(msg, match[1], "Panel 3GB - 2 Weeks");
});

bot.onText(/\/3gb1week (.+)/, (msg, match) => {
  handleShopCommand(msg, match[1], "Panel 3GB - 1 Week");
});

bot.onText(/\/1gb3weeks (.+)/, (msg, match) => {
  handleShopCommand(msg, match[1], "Panel 1GB - 3 Weeks");
});

// Process shop command
function handleShopCommand(msg, credentials, itemDescription) {
  try {
    // Validate input
    const [username, password] = credentials.split(":");
    if (!username || !password) {
      bot.sendMessage(msg.chat.id, "Invalid format. Use: /<command> username:password");
      return;
    }

    // Ensure shop file exists
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
    bot.sendMessage(
      msg.chat.id,
      `Item successfully added to the shop!\n\nItem: ${itemDescription}\nUsername: ${username}\nPassword: ${password}\nLink: https://panel.navocloud.com`
    );
  } catch (error) {
    console.error("Error updating shop.json:", error);
    bot.sendMessage(msg.chat.id, "An error occurred while processing your request. Please try again.");
  }
}
