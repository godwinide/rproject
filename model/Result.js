const { Schema, model } = require("mongoose");

const ResultSchema = new Schema({
    tableId: {
        type: String,
        required: true
    },
    resultType: {
        type: Boolean,
        required: true
    },
    trialPostion: {
        type: Number,
        required: false,
        default: 0
    },
    date: {
        type: String,
        required: true
    }
});

const Result = model("Result", ResultSchema);

module.exports = Result;
