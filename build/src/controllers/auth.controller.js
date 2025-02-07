"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.AuthController = void 0;
const axios_1 = __importStar(require("axios"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const { GITHUB_CLIENT_ID: clientId, GITHUB_CLIENT_SECRETS: clientSecrets, JWT_SECRET: jwtSecret, JWT_EXPIRESIN: expiresIn, } = process.env;
class AuthController {
    constructor() {
        this.auth = (request, response) => __awaiter(this, void 0, void 0, function* () {
            const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}`;
            response.status(200).json({ redirectUrl });
        });
        this.authCallback = (request, response) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { code } = request.query;
                const accessTokenUrl = yield axios_1.default.post('https://github.com/login/oauth/access_token', {
                    client_id: clientId,
                    client_secret: clientSecrets,
                    code,
                }, {
                    headers: {
                        Accept: 'application/json',
                    },
                });
                const userDataResult = yield axios_1.default.get('https://api.github.com/user', {
                    headers: {
                        Authorization: `Bearer ${accessTokenUrl.data.access_token}`,
                    },
                });
                const { node_id: id, avatar_url: avatarUrl, name } = userDataResult.data;
                const token = jsonwebtoken_1.default.sign({ id }, String(jwtSecret), {
                    expiresIn,
                });
                response.status(200).json({ id, avatarUrl, name, token });
            }
            catch (err) {
                if ((0, axios_1.isAxiosError)(err)) {
                    response.status(400).json((_a = err.response) === null || _a === void 0 ? void 0 : _a.data);
                    return;
                }
                response.status(500).json({ message: 'Something went wrong!' });
            }
        });
    }
}
exports.AuthController = AuthController;
