const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const token = "7928488118:AAHwF6bGSJewnSx0XhYvLcjGC1xDLSsJdTw";
const bot = new TelegramBot(token, { polling: true });

const shopFile = "./shop.json";

// Handle /3gb2weeks command
bot.onText(/\/3gb2weeks (.+)/, (msg, match) => {
  handleShopCommand(msg, match[1], "Panel 3GB - 2 Weeks");
});

// Handle /3gb1week command
bot.onText(/\/3gb1week (.+)/, (msg, match) => {
  handleShopCommand(msg, match[1], "Panel 3GB - 1 Week");
});

// Handle /1gb3weeks command
bot.onText(/\/1gb3weeks (.+)/, (msg, match) => {
  handleShopCommand(msg, match[1], "Panel 1GB - 3 Weeks");
});

// Process shop command
function handleShopCommand(msg, credentials, itemDescription) {
  const [username, password] = credentials.split(":");
  if (!username || !password) {
    bot.sendMessage(msg.chat.id, "Invalid format. Use: /<command> username:password");
    return;
  }

  // Update shop.json
  const shopData = JSON.parse(fs.readFileSync(shopFile));
  shopData.push({ username, password, link: "https://panel.navocloud.com", item: itemDescription });
  fs.writeFileSync(shopFile, JSON.stringify(shopData, null, 2));

  // Notify the user
  bot.sendMessage(
    msg.chat.id,
    `Purchase of ${itemDescription} successful!\n\nUsername: ${username}\nPassword: ${password}\nLink: https://panel.navocloud.com`
  );
}
