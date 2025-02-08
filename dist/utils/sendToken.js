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
exports.generateAccessAndRefreshTokens = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const generateAccessToken = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const jwtSecret = process.env.ACCESS_TOKEN_SECRET;
    if (!jwtSecret) {
        throw new Error("ACCESS_TOKEN_SECRET is not defined in the environment variables.");
    }
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.sign({
            id: user.id,
        }, jwtSecret, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE ? parseInt(process.env.ACCESS_TOKEN_EXPIRE) : "15m" }, (err, token) => {
            if (err)
                return reject(err);
            resolve(token);
        });
    });
});
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const jwtSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!jwtSecret) {
        throw new Error("REFRESH_TOKEN_SECRET is not defined in the environment variables.");
    }
    const expiresIn = process.env.REFRESH_TOKEN_EXPIRE ? parseInt(process.env.REFRESH_TOKEN_EXPIRE) : "1d";
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.sign({ id: user.id }, jwtSecret, { expiresIn }, (err, token) => {
            if (err)
                return reject(err);
            resolve(token);
        });
    });
});
/**
 * Generating access and refresh tokens for a user
 * @param {number} id - User ID
 * @returns {Promise<{ accessToken: string; refreshToken: string }>}
 */
const generateAccessAndRefreshTokens = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield database_1.default.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new Error("User not found");
        }
        const accessToken = yield (0, exports.generateAccessToken)(user);
        const refreshToken = yield generateRefreshToken(user);
        yield database_1.default.user.update({
            where: { id },
            data: {
                refreshtoken: refreshToken,
            },
        });
        return { accessToken, refreshToken };
    }
    catch (error) {
        console.error("Error generating tokens:", error);
        throw new Error("Failed to generate tokens");
    }
});
exports.generateAccessAndRefreshTokens = generateAccessAndRefreshTokens;
