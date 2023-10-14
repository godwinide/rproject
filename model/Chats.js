const { Schema, model } = require("mongoose");

const ChatSchema = new Schema({
    chatId: {
        type: String,
        required: true
    }
});

const Chat = model("Chat", ChatSchema);

module.exports = Chat;
