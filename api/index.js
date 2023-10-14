const router = require("express").Router();
const Chat = require("../model/Chats");
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.botToken, { polling: true });

router.post("/message", async (req, res) => {
    try {
        const {
            message
        } = req.body;

        if (message) {
            // send message
            const chatIds = await Chat.find({});
            chatIds.forEach((chatId) => {
                bot.sendMessage(chatId.chatId, message)
                    .then(() => {
                        console.log(`Broadcast message sent to ${chatId.chatId}`);
                    })
                    .catch((error) => {
                        console.error(`Error sending message to ${chatId.chatId}: ${error.message}`);
                    });
            });
            return res.status(200).json({ success: true });
        }
        else {
            return res.status(200).json({ success: false });
        }

    } catch (err) {
        console.log(err);
    }
})

module.exports = router;