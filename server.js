require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Chat = require("./model/Chats");
const Message = require("./model/Message");
const app = express();
const TelegramBot = require('node-telegram-bot-api');
const Table = require("./model/Table");
const Result = require("./model/Result");
const Entry = require("./model/Entries");
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
            type,
            resultType,
            tableName,
            prompt,
            numbers
        } = req.body;

        if (message) {
            // send message
            const chatIds = await Chat.find({});
            const isSent = await Message.findOne({ msgID });

            // save entry
            if (prompt) {
                const newEntry = new Entry({
                    tableName,
                    prompt,
                    numbers
                });
                await newEntry.save();
            }

            if (isSent) {
                return res.status(200).json({ success: true });
            }


            if (resultType === "won" || resultType === "loss") {

                const tableId = tableName?.replace(/ /g, "").toLowerCase()
                const table = await Table.findOne({ tableId });

                if (table) {

                    const newResult = new Result({
                        tableId,
                        resultType: resultType === "won" ? true : false,
                        trialPostion: table.trialPostion,
                        date: Date.now()
                    });

                    await newResult.save();

                    await Table.updateOne({ tableId }, {
                        trialPostion: resultType === "won" ? 1 : table.trialPostion + 1,
                        lastUpdated: Date.now()
                    });


                }
                else {
                    const newTable = new Table({
                        tableId,
                        tableName,
                        trialPostion: 1,
                        lastUpdated: Date.now()
                    });

                    const newResult = new Result({
                        tableId,
                        resultType: resultType === "won" ? true : false,
                        trialPostion: 1,
                        date: Date.now()
                    });

                    await newTable.save();
                    await newResult.save();
                }
            }


            chatIds.slice(0, 1).forEach((chatId) => {
                bot.sendMessage(chatId.chatId, message)
                    .then(async sentmessage => {
                        if (type == 'ready') {
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
                    await bot.deleteMessage(c.chatId, c.telMsgID)
                        .catch(err => console.log(err));
                    await Message.deleteOne({ msgID: c.msgID })
                }
            });
        }

        if (chats2) {
            chats2.forEach(async c => {
                if (((Date.now() - c.timeStamp) / 1000) > 120) {
                    await Message.deleteOne({ msgID: c.msgID })
                        .catch(err => console.log(err));
                }
            });
        }

        setTimeout(cleanDB, 10000);
    } catch (err) {
        // console.log(err);
    }
}

cleanDB();


const PORT = 5000;
app.listen(PORT, () => console.log(`server running on port ${PORT}`));