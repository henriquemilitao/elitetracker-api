"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.focusTimeModel = void 0;
const mongoose_1 = require("mongoose");
const FocusTimeSchema = new mongoose_1.Schema({
    timeFrom: Date,
    timeTo: Date,
    userId: String,
}, {
    versionKey: false,
    timestamps: true,
});
exports.focusTimeModel = (0, mongoose_1.model)('FocusTime', FocusTimeSchema);
