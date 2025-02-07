"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const database_1 = require("./database");
const routes_1 = require("./routes");
const app = (0, express_1.default)();
(0, database_1.setupMongo)()
    .then(() => {
    app.use((0, cors_1.default)({
        origin: true,
    }));
    app.use(express_1.default.json());
    app.use(routes_1.routes);
    app.listen(4000, () => console.log('🚀 Server is running at port 4000'));
})
    .catch((err) => {
    console.log(err.message);
});
