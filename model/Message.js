const { Schema, model } = require("mongoose");

const MessageSchema = new Schema({
    msgID: {
        type: String,
        required: true
    },
    timeStamp: {
        type: String,
        required: false
    },
    temporal: {
        type: Boolean,
        required: false,
        default: false
    },
    telMsgID: {
        type: String,
        required: false
    },
    chatId: {
        type: String,
        required: false
    }
});

const Message = model("Message", MessageSchema);
module.exports = Message;
