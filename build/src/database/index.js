"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMongo = setupMongo;
const mongoose_1 = __importDefault(require("mongoose"));
const { MONGO_URL: mongoUrl } = process.env;
function setupMongo() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (mongoose_1.default.connection.readyState === 1) {
                return;
            }
            console.log('🎲 Connecting to database...');
            yield mongoose_1.default.connect(String(mongoUrl), {
                serverSelectionTimeoutMS: 5000,
            });
            console.log('✅ Database Connected!');
        }
        catch (error) {
            throw new Error('❌ Database not connected!');
        }
    });
}
