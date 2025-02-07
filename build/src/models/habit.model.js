"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.habitModel = void 0;
const mongoose_1 = require("mongoose");
const HabitSchema = new mongoose_1.Schema({
    name: String,
    completedDates: [Date],
    userId: String,
}, {
    versionKey: false,
    timestamps: true,
});
exports.habitModel = (0, mongoose_1.model)('Habit', HabitSchema);
