const TelegramBot = require("node-telegram-bot-api");
const Process = require("./process");

const token = process.env.BOT_TOKEN;
const options = {
  webHook: {
    port: process.env.PORT,
  },
};
const url = process.env.APP_URL;
const bot = new TelegramBot(token, options);

bot.setWebHook(`${url}/bot${token}`);
const colorNums = 5;

bot.on("photo", async (msg) => {
  const chatId = msg.chat.id;
  const fileId = msg.photo[msg.photo.length - 1].file_id;

  bot.sendMessage(chatId, "Image received, analyzing...");

  const buf = await Process.stream2buffer(bot.getFileStream(fileId));
  const vector = await Process.getVectors(buf);

  if (vector && vector.length > 0) {
    colors = await Process.applyKmeans(vector, colorNums);
  }

  if (colors.length > 0) {
    colors.sort((a, b) => {
      return b.percentage - a.percentage;
    });

    let respStr = "";
    for (const color of colors) {
      respStr += `${color.hex}\n`;
    }
    bot.sendMessage(chatId, respStr);

    const colorDataImgBuf = Process.createColorDataImage(colors);
    bot.sendPhoto(chatId, colorDataImgBuf);
  }
});

bot.on("text", (msg) => {
  const chatId = msg.chat.id;
  const RegExp = /^#[0-9A-F]{6}$/i;
  if (RegExp.test(msg.text)) {
    const hexColorImgBuf = Process.createHexColorImage(colors, 256, 256);
    bot.sendPhoto(chatId, hexColorImgBuf);
  } else {
    bot.sendMessage(chatId, "Try send a photo or a hex string to me");
  }
});
