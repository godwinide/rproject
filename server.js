require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Chat = require("./model/Chats");
const Message = require("./model/Message");
const cron = require('node-cron');

const app = express();

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.botToken, { polling: true });
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const chatExist = await Chat.findOne({ chatId });
    if (!chatExist) {
        const newChat = new Chat({ chatId: chatId });
        await newChat.save();
    }
    bot.sendMessage(chatId, 'Welcome, your account has been activated!.');
});

require("./config/db")();

app.use(cors());
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());


app.post("/api/message", async (req, res) => {
    try {
        const {
            message,
            msgID,
            type: msgType
        } = req.body;

        if (message) {
            // send message
            const chatIds = await Chat.find({});
            const isSent = await Message.findOne({ msgID });

            if (isSent) {
                return res.status(200).json({ success: true });
            }

            chatIds.forEach((chatId) => {
                bot.sendMessage(chatId.chatId, message)
                    .then(async sentmessage => {
                        if (msgType == 'ready') {
                            const newMsg = new Message({
                                msgID,
                                temporal: true,
                                timeStamp: Date.now(),
                                telMsgID: sentmessage.message_id,
                                chatId: chatId.chatId
                            });
                            await newMsg.save();
                        } else {
                            const newMsg = new Message({
                                msgID,
                                temporal: false,
                                timeStamp: Date.now(),
                                telMsgID: sentmessage.message_id,
                                chatId: chatId.chatId
                            });
                            await newMsg.save();
                        }
                    })
            })
            return res.status(200).json({ success: true });
        }
        else {
            return res.status(200).json({ success: false });
        }
    } catch (err) {
        console.log(err);
    }
});


// CRON JOBS
const cleanDB = async () => {
    try {
        const chats1 = await Message.find({ temporal: true });
        const chats2 = await Message.find({ temporal: false });

        if (chats1) {
            chats1.forEach(async c => {
                if (((Date.now() - c.timeStamp) / 1000) > 30) {
                    await bot.deleteMessage(c.chatId, c.telMsgID);
                    await Message.deleteOne({ msgID: c.msgID })
                }
            });
        }

        if (chats2) {
            chats2.forEach(async c => {
                if (((Date.now() - c.timeStamp) / 1000) > 120) {
                    await Message.deleteOne({ msgID: c.msgID })
                }
            });
        }

        setTimeout(cleanDB, 10000);
    } catch (err) {
        console.log(err);
    }
}

cleanDB();


const PORT = 5000;
app.listen(PORT, () => console.log(`server running on port ${PORT}`));