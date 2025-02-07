"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(request, response, next) {
    const authToken = request.headers.authorization;
    if (!authToken) {
        response.status(401).json({ message: 'Token not provided' });
        return;
    }
    const [, token] = authToken.split(' ');
    try {
        jsonwebtoken_1.default.verify(token, String(process.env.JWT_SECRET), (err, decoded) => {
            if (err) {
                throw new Error();
            }
            request.user = decoded;
        });
    }
    catch (_a) {
        response.status(401).json({ message: 'Token is invalid' });
        return;
    }
    next();
}
