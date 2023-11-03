const { Schema, model } = require("mongoose");

const EntrySchema = new Schema({
    tableName: {
        type: String,
        required: true,
    },
    prompt: {
        type: Array,
        required: true
    },
    numbers: {
        type: Array,
        required: true
    },
    sent: {
        type: Boolean,
        required: false,
        default: false
    },
    date: {
        type: String,
        required: false,
        default: Date.now()
    }
});

const Entry = model("Entry", EntrySchema);

module.exports = Entry;
