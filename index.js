const TelegramBot = require("node-telegram-bot-api");
const Process = require("./process");

const token = process.env.BOT_TOKEN;
// const bot = new TelegramBot(token, { polling: true });
const bot = new TelegramBot(token, { webHook: true });
const colorNums = 5;

bot.on("photo", async (msg) => {
  const chatId = msg.chat.id;
  const fileId = msg.photo[msg.photo.length - 1].file_id;

  const buf = await Process.stream2buffer(bot.getFileStream(fileId));
  const vector = await Process.getVectors(buf);

  if (vector && vector.length > 0) {
    colors = await Process.applyKmeans(vector, colorNums);
  }

  if (colors.length > 0) {
    colors.sort((a, b) => {
      return b.percentage - a.percentage;
    });

    const colorDataImgBuf = Process.createColorDataImage(colors);
    bot.sendPhoto(chatId, colorDataImgBuf);

    let respStr = "";
    for (const color of colors) {
      respStr += `${color.hex}\n`;
    }
    bot.sendMessage(chatId, respStr);
  }
});

bot.on("text", (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Send a photo to get color analyze");
});
